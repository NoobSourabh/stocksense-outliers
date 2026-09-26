"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";

export function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: stockApi.me, retry: false });

  useEffect(() => {
    if (session.isSuccess && isLogin) router.replace("/dashboard");
    if (session.isError && !isLogin && pathname !== "/") router.replace("/login");
  }, [isLogin, pathname, router, session.isError, session.isSuccess]);

  if (!isLogin && pathname !== "/" && !session.isSuccess) {
    return <main className="grid min-h-screen place-items-center bg-background px-4 text-sm text-muted-foreground" role="status">Checking your session…</main>;
  }

  return <>{children}</>;
}
