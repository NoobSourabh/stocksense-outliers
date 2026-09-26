"""
StockSense Backend - Centralized error handling.

Maps service-layer exceptions to the documented JSON error envelope.
"""

from fastapi import Request
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Domain exceptions
# ---------------------------------------------------------------------------

class AppError(Exception):
    """Base application error with status code and structured payload."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        field_errors: dict[str, str] | None = None,
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.field_errors = field_errors
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, entity: str, identifier: str | None = None):
        msg = f"{entity} not found" + (f": {identifier}" if identifier else "")
        super().__init__(404, "NOT_FOUND", msg)


class ConflictError(AppError):
    def __init__(self, code: str, message: str, field_errors: dict[str, str] | None = None):
        super().__init__(409, code, message, field_errors)


class ValidationError(AppError):
    def __init__(self, message: str, field_errors: dict[str, str] | None = None):
        super().__init__(422, "VALIDATION_ERROR", message, field_errors)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(403, "FORBIDDEN", message)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(401, "UNAUTHORIZED", message)


# ---------------------------------------------------------------------------
# FastAPI exception handler
# ---------------------------------------------------------------------------

async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    """Convert AppError into the documented JSON error envelope."""
    body: dict = {
        "error": {
            "code": exc.code,
            "message": exc.message,
        }
    }
    if exc.field_errors:
        body["error"]["fieldErrors"] = exc.field_errors
    return JSONResponse(status_code=exc.status_code, content=body)
