import { apiFetch } from "@/lib/api";

export interface Page<T> { items: T[]; total: number; nextCursor?: string | null }
export interface StockUser { id: string; loginId: string; name: string; email: string; role: "manager" | "staff"; isActive: boolean }
export interface AuthResult { user: StockUser }
export interface Category { id: string; code: string; name: string; isActive: boolean }
export interface Location { id: string; warehouseId: string; code: string; name: string; kind: string; isActive: boolean }
export interface Warehouse { id: string; code: string; name: string; address?: string | null; isActive: boolean; locations: Location[] }
export interface Partner { id: string; name: string; kind: string; isActive: boolean }
export interface Balance { locationId: string; locationName: string; warehouseName: string; onHand: string; freeToUse: string }
export interface Product { id: string; name: string; sku: string; categoryId?: string; categoryName: string; unit: string; unitCost: string; reorderPoint: string; onHand?: string; freeToUse?: string; onHandTotal?: string; freeToUseTotal?: string; isActive: boolean; balances?: Balance[] }
export interface ProductInput { name: string; sku: string; categoryId: string; unit: string; unitCost: string; reorderPoint: string; initialStock?: string }
export interface OperationLine { id: string; productId: string; productName: string; productSku: string; quantity: string; countedQuantity?: string | null; previousQuantity?: string | null; delta?: string | null; reason?: string | null; isShort: boolean }
export interface Operation { id: string; reference: string; type: string; status: string; partnerId?: string | null; partnerName?: string | null; sourceLocationId?: string | null; sourceLocationName?: string | null; destinationLocationId?: string | null; destinationLocationName?: string | null; scheduleDate?: string | null; note?: string | null; createdByName?: string; createdAt?: string; lineCount?: number; isLate: boolean; lines?: OperationLine[] }
export interface OperationInput { type: string; partnerId?: string | null; sourceLocationId?: string | null; destinationLocationId?: string | null; scheduleDate?: string | null; note?: string | null; lines: { productId: string; quantity: string; countedQuantity?: string; reason?: string }[] }
export interface StockMove { id: string; operationId: string; reference: string; type: string; productId: string; productName: string; productSku: string; fromLocationName?: string | null; toLocationName?: string | null; quantity: string; signedDelta: string; actorName: string; reason?: string | null; occurredAt: string }
export interface Dashboard { receiptSummary: { toReceive: number; late: number; total: number }; deliverySummary: { toDeliver: number; late: number; waiting: number; total: number }; lowStock: { productId: string; productName: string; sku: string; onHand: string; reorderPoint: string; unit: string }[]; recentOperations: Operation[] }

function queryString(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const stockApi = {
  login: (loginId: string, password: string) => apiFetch<AuthResult>("/auth/login", { method: "POST", body: { loginId, password } }),
  signup: (input: { loginId: string; name: string; email: string; password: string; confirmPassword: string }) => apiFetch<AuthResult>("/auth/signup", { method: "POST", body: input }),
  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<AuthResult>("/auth/me", { auth: true }),
  dashboard: () => apiFetch<Dashboard>("/dashboard", { auth: true }),
  products: (search = "") => apiFetch<Page<Product>>(`/products${queryString({ search })}`, { auth: true }),
  product: (id: string) => apiFetch<Product>(`/products/${encodeURIComponent(id)}`, { auth: true }),
  createProduct: (body: ProductInput) => apiFetch<Product>("/products", { method: "POST", body, auth: true }),
  updateProduct: (id: string, body: Partial<ProductInput>) => apiFetch<Product>(`/products/${encodeURIComponent(id)}`, { method: "PATCH", body, auth: true }),
  categories: () => apiFetch<Page<Category>>("/categories", { auth: true }),
  warehouses: (includeLocations = true) => apiFetch<Page<Warehouse>>(`/warehouses${queryString({ includeLocations: includeLocations ? "true" : undefined })}`, { auth: true }),
  partners: (kind?: string, search?: string) => apiFetch<Page<Partner>>(`/partners${queryString({ kind, search })}`, { auth: true }),
  operations: (filters: { type?: string; status?: string; search?: string } = {}) => apiFetch<Page<Operation>>(`/operations${queryString(filters)}`, { auth: true }),
  operation: (id: string) => apiFetch<Operation>(`/operations/${encodeURIComponent(id)}`, { auth: true }),
  createOperation: (body: OperationInput) => apiFetch<Operation>("/operations", { method: "POST", body, auth: true }),
  updateOperation: (id: string, body: Partial<OperationInput>) => apiFetch<Operation>(`/operations/${encodeURIComponent(id)}`, { method: "PATCH", body, auth: true }),
  operationAction: (id: string, action: "ready" | "validate" | "cancel") => apiFetch<Operation>(`/operations/${encodeURIComponent(id)}/${action}`, { method: "POST", auth: true }),
  moves: (filters: { type?: string; search?: string } = {}) => apiFetch<Page<StockMove>>(`/moves${queryString(filters)}`, { auth: true }),
};
