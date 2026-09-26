"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { stockApi } from "@/lib/stock-api";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isSignup = mode === "signup";
  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One symbol", met: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~;']/.test(password) },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (isSignup) {
      if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~;']/.test(password)) {
        setNotice("Use at least 8 characters, with uppercase, lowercase, and a symbol.");
        return;
      }
      if (password !== values.get("confirmPassword")) {
        setNotice("Those passwords don’t match. Please check and try again.");
        return;
      }
    }
    const loginId = String(values.get("loginId") ?? "").trim();
    if (isSignup && !/^[a-zA-Z0-9_]{6,12}$/.test(loginId)) {
      setNotice("Login ID must be 6–12 characters using letters, numbers, or underscores.");
      return;
    }
    setIsSubmitting(true);
    setNotice("");
    try {
      const result = isSignup
        ? await stockApi.signup({ loginId, name: String(values.get("name") ?? "").trim(), email: String(values.get("email") ?? "").trim(), password, confirmPassword: String(values.get("confirmPassword") ?? "") })
        : await stockApi.login(loginId, password);
      queryClient.setQueryData(["auth", "me"], result);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        const invalidCredentials = !isSignup && error.status === 401 && error.message.startsWith("Invalid Login Id or Password");
        setNotice(invalidCredentials ? "Invalid Login Id or Password." : error.message);
      } else {
        setNotice("Unable to connect to StockSense. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <header className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Fingerprint className="size-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-primary">STOCKSENSE ID</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "A few details and you’ll be ready to go." : "Sign in to continue to your workspace."}
          </p>
        </header>

        <Card className="gap-0 rounded-2xl border border-border p-5 shadow-sm sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1" role="group" aria-label="Account access">
            {(["signin", "signup"] as const).map((tab) => (
              <Button
                key={tab}
                type="button"
                variant={mode === tab ? "secondary" : "ghost"}
                aria-pressed={mode === tab}
                onClick={() => { setMode(tab); setNotice(""); setPassword(""); }}
                className={`h-9 rounded-md px-3 text-sm font-medium ${mode === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {tab === "signin" ? "Sign in" : "Create account"}
              </Button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="name" name="name" required maxLength={255} autoComplete="name" placeholder="Your name" className="h-11 rounded-lg bg-background pl-10 pr-3 text-sm" />
                </div>
              </div>
            )}

            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="login-id">Login ID</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="login-id" name="loginId" required minLength={6} maxLength={12} autoComplete="username" placeholder="Choose a 6–12 character ID" className="h-11 rounded-lg bg-background pl-10 pr-3 text-sm" />
                </div>
                <p className="text-xs text-muted-foreground">You’ll use this ID whenever you sign in.</p>
              </div>
            )}

            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-11 rounded-lg bg-background pl-10 pr-3 text-sm" />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="signin-id">Login ID</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="signin-id" name="loginId" required autoComplete="username" placeholder="Enter your Login ID" className="h-11 rounded-lg bg-background pl-10 pr-3 text-sm" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                {!isSignup && <Button type="button" variant="link" size="xs" onClick={() => setNotice("Password recovery is not available yet.")} className="h-auto p-0 text-xs font-medium">Forgot password?</Button>}
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={isSignup ? 8 : undefined} autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "Create a password" : "Enter your password"} value={password} onChange={(event) => { setPassword(event.target.value); setNotice(""); }} className="h-11 rounded-lg bg-background pl-10 pr-11 text-sm" />
                <Button type="button" variant="ghost" size="icon" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {isSignup && (
                <ul aria-label="Password requirements" aria-live="polite" className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {passwordRequirements.map(({ label, met }) => (
                    <li key={label} className={`flex items-center gap-2 text-xs ${met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded border ${met ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950" : "border-muted-foreground/50"}`}>
                        {met && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="Enter your password again" className="h-11 rounded-lg bg-background px-3 text-sm" />
              </div>
            )}

            {notice && <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{notice}</p>}

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 rounded-lg px-4 text-sm font-semibold">{isSubmitting ? "Connecting…" : isSignup ? "Create account" : "Sign in"}<ArrowRight className="size-4" aria-hidden="true" /></Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Your account is protected with secure sign-in.</p>
        </Card>
        <p className="mt-5 text-center text-xs text-muted-foreground">Need help? Contact support.</p>
      </div>
    </main>
  );
}
