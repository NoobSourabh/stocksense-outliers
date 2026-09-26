/**
 * Root provider composition for the app.
 * Wraps the app with Tooltip, Toast, and React Query providers.
 */
"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/query-provider";
import { ToastProvider } from "@/components/toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <ToastProvider>{children}</ToastProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
