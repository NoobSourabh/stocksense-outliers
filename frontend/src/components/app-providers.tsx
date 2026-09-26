/**
 * Root provider composition for the app.
 * Wraps the app with Tooltip, Toast, and React Query providers.
 */
"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/query-provider";
import { ToastProvider } from "@/components/toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionGate } from "@/components/auth/session-gate";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <ToastProvider><SessionGate>{children}</SessionGate></ToastProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
