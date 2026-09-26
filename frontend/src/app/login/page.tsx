"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, UserRound } from "lucide-react";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [notice, setNotice] = useState("");

  const isSignup = mode === "signup";
  const passwordRequirements = [
    { label: "At least 9 characters", met: signUpPassword.length >= 9 },
    { label: "One uppercase letter", met: /[A-Z]/.test(signUpPassword) },
    { label: "One lowercase letter", met: /[a-z]/.test(signUpPassword) },
    { label: "One symbol", met: /[!@#$%^&*(),.?":{}|<>]/.test(signUpPassword) },
  ];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (isSignup) {
      if (password.length < 9 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setNotice("Use at least 9 characters, with uppercase, lowercase, and a symbol.");
        return;
      }
      if (password !== values.get("confirmPassword")) {
        setNotice("Those passwords don’t match. Please check and try again.");
        return;
      }
      setNotice("Your account details are ready.");
      return;
    }
    setNotice("Your sign-in details are ready.");
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

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Account access">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                onClick={() => { setMode(tab); setNotice(""); }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="space-y-1.5">
                <label htmlFor="login-id" className="text-sm font-medium">Login ID</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input id="login-id" name="loginId" required minLength={6} maxLength={12} autoComplete="username" placeholder="Choose a 6–12 character ID" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <p className="text-xs text-muted-foreground">You’ll use this ID whenever you sign in.</p>
              </div>
            )}

            {isSignup && (
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="space-y-1.5">
                <label htmlFor="signin-id" className="text-sm font-medium">Login ID</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input id="signin-id" name="loginId" required autoComplete="username" placeholder="Enter your Login ID" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                {!isSignup && <button type="button" onClick={() => setNotice("Password recovery instructions will be sent to your registered email.")} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>}
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={isSignup ? 9 : undefined} autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "Create a password" : "Enter your password"} value={isSignup ? signUpPassword : undefined} onChange={isSignup ? (event) => { setSignUpPassword(event.target.value); setNotice(""); } : undefined} className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
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
                <label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</label>
                <input id="confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={9} autoComplete="new-password" placeholder="Enter your password again" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            )}

            {notice && <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{notice}</p>}

            <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {isSignup ? "Create account" : "Sign in"}<ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Your account is protected with secure sign-in.</p>
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">Need help? Contact support.</p>
      </div>
    </main>
  );
}
