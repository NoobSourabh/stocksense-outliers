"use client";

import { useEffect, useId, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Bug,
  Check,
  CheckCircle2,
  Circle,
  Columns,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  Key,
  LayoutGrid,
  Lock,
  LogIn,
  Mail,
  Moon,
  Shield,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

type AuthTab = "signin" | "signup";

interface ToastState {
  visible: boolean;
  message: string;
  type: "info" | "success" | "error";
}

export default function IdentityPortalPage() {
  const theme = useTheme();

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);

  // Sign In Form State
  const [signInLoginId, setSignInLoginId] = useState("analyst_omega");
  const [signInPassword, setSignInPassword] = useState("NovaSecure2026@");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showErrorNotice, setShowErrorNotice] = useState(false);

  // Sign Up Form State
  const [signUpLoginId, setSignUpLoginId] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Floating Toast State (exact Stitch mobile floating alert)
  const [floatingToast, setFloatingToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  const rememberMeId = useId();

  // Responsive screen listener
  useEffect(() => {
    const checkScreen = () => {
      const isLarge = window.innerWidth >= 1024;
      setIsLargeScreen(isLarge);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Floating Toast Helper
  const triggerToast = (message: string, type: "info" | "success" | "error" = "info") => {
    setFloatingToast({ visible: true, message, type });
    if (type === "error") {
      showErrorToast(new Error(message));
    } else {
      showSuccessToast(message);
    }
  };

  useEffect(() => {
    if (floatingToast.visible) {
      const timer = setTimeout(() => {
        setFloatingToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [floatingToast.visible]);

  // Sign Up Login ID Validation (6-12 chars)
  const loginIdCount = signUpLoginId.length;
  const isLoginIdValid = loginIdCount >= 6 && loginIdCount <= 12;

  // Sign Up Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(signUpEmail.trim());

  // Password Security Criteria (matches mobile Stitch spec)
  const ruleLength = signUpPassword.length > 8;
  const ruleLower = /[a-z]/.test(signUpPassword);
  const ruleUpper = /[A-Z]/.test(signUpPassword);
  const ruleSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(signUpPassword);
  const allPasswordRulesMet = ruleLength && ruleLower && ruleUpper && ruleSpecial;

  // Password Match Validation
  const hasConfirmPassword = signUpConfirmPassword.length > 0;
  const passwordsMatch = hasConfirmPassword && signUpPassword === signUpConfirmPassword;

  // Sign In Submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoginId.trim() || !signInPassword) {
      setShowErrorNotice(true);
      triggerToast("Please enter both Login ID and Password.", "error");
      return;
    }

    if (signInLoginId.toLowerCase().includes("fail")) {
      setShowErrorNotice(true);
      triggerToast("Auth Gateway returned HTTP 401: Unauthorized", "error");
      return;
    }

    setShowErrorNotice(false);
    triggerToast(`Welcome back, ${signInLoginId}! Authenticating session with Nova ID Core...`, "success");
  };

  // Sign Up Submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoginIdValid) {
      triggerToast("Login ID must be between 6 and 12 characters.", "error");
      return;
    }

    if (!isEmailValid) {
      triggerToast("Please enter a valid corporate or personal Email ID.", "error");
      return;
    }

    if (!allPasswordRulesMet) {
      triggerToast("Please satisfy all password complexity criteria.", "error");
      return;
    }

    if (!passwordsMatch) {
      triggerToast("Passwords do not match. Please re-enter for verification.", "error");
      return;
    }

    triggerToast(`Registration successful for ${signUpLoginId}! Confirmation dispatch pending.`, "success");

    // Auto-transition to Sign In tab with prefilled Login ID
    setSignInLoginId(signUpLoginId);
    setTimeout(() => {
      setActiveTab("signin");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  };

  // Toggle simulation error banner
  const simulateLoginError = () => {
    setShowErrorNotice(true);
    triggerToast("Auth Gateway returned HTTP 401: Unauthorized", "error");
  };

  // Forgot password action
  const handleForgotPassword = () => {
    triggerToast("Recovery email link dispatched to primary vault inbox", "info");
  };

  // Display conditions
  const showDualColumn = isLargeScreen && isSideBySide;
  const showSignInView = showDualColumn || activeTab === "signin";
  const showSignUpView = showDualColumn || activeTab === "signup";

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface bg-background text-foreground antialiased selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300">
      {/* ========================================================================= */}
      {/* 1. FIXED SAFE HEADER (Mobile Stitch Design) */}
      {/* ========================================================================= */}
      <header
        className="fixed top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl shadow-sm transition-colors duration-300"
        data-purpose="navigation-header"
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground leading-none">
                Nova ID
              </span>
              <span className="font-mono text-xs text-muted-foreground leading-tight">
                Auth Gateway
              </span>
            </div>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Side-by-Side Switcher */}
            {isLargeScreen && (
              <button
                type="button"
                className="hidden lg:flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                onClick={() => setIsSideBySide((prev) => !prev)}
                title="Toggle Side-by-Side or Mobile Tabbed View"
              >
                {isSideBySide ? (
                  <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>{isSideBySide ? "Tabbed View" : "Side-by-Side View"}</span>
              </button>
            )}

            {/* 256-bit Security Pill Badge */}
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-mono text-xs font-semibold">256-bit</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              aria-label="Toggle Theme"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => theme?.toggleTheme()}
            >
              {theme?.darkMode ? (
                <Sun className="h-5 w-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="relative flex flex-1 flex-col items-center px-4 pt-20 pb-8 sm:px-6">
        <div className="flex w-full max-w-md flex-col gap-4 transition-all duration-300 sm:max-w-lg lg:max-w-5xl">
          {/* Visual Brand Badge & Security Micro-banner */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 shadow-sm dark:bg-primary-950/70 dark:text-primary-400">
                <Shield className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-foreground">Nova ID</span>
                <span className="rounded-full bg-surface-container-high bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground leading-tight">
                  AUTH v4.2
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-xs">TLS 1.3 Active</span>
            </div>
          </div>

          {/* Segmented Tab Switcher with Sliding Glider */}
          {(!showDualColumn || !isLargeScreen) && (
            <div className="relative flex items-center rounded-xl bg-muted/80 p-1 shadow-sm transition-all dark:bg-muted/40">
              {/* Animated Glider Background */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-card shadow-sm transition-transform duration-300 ease-out pointer-events-none ${
                  activeTab === "signin" ? "translate-x-0 left-1" : "translate-x-full left-1"
                }`}
              />

              {/* Sign In Tab Button */}
              <button
                type="button"
                className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2.5 text-center text-sm transition-colors active:scale-95 ${
                  activeTab === "signin"
                    ? "font-semibold text-primary-600 dark:text-primary-400"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("signin")}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>

              {/* Sign Up Tab Button */}
              <button
                type="button"
                className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2.5 text-center text-sm transition-colors active:scale-95 ${
                  activeTab === "signup"
                    ? "font-semibold text-primary-600 dark:text-primary-400"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("signup")}
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Interactive Notice Alert Banner (Simulated Error Demo from wireframe spec) */}
          {showErrorNotice && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive shadow-sm transition-all duration-300 dark:bg-destructive/20"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">Authentication Alert</span>
                <span className="text-xs leading-tight opacity-90">
                  Invalid Login Id or Password. Please verify credentials conforming to Nova vault policy.
                </span>
              </div>
              <button
                type="button"
                aria-label="Close error notice"
                onClick={() => setShowErrorNotice(false)}
                className="p-1 hover:opacity-70 active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* AUTH CARDS WRAPPER */}
          {/* ===================================================================== */}
          <div
            className={`flex w-full flex-col gap-6 ${
              showDualColumn ? "lg:flex-row lg:items-stretch" : ""
            }`}
          >
            {/* ----------------------------------------------------------------- */}
            {/* SUB-VIEW 1: SIGN IN CARD */}
            {/* ----------------------------------------------------------------- */}
            {showSignInView && (
              <div
                className="flex w-full flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 shadow-md transition-all duration-200 hover:shadow-lg sm:p-7"
                id="viewSignIn"
              >
                <div className="flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Welcome Back
                      </h1>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Sign in with your verified Nova ID credentials
                    </p>
                  </div>

                  {/* Form */}
                  <form className="mt-2 flex flex-col gap-4" onSubmit={handleSignInSubmit}>
                    {/* Field: Login ID */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-medium text-foreground sm:text-sm"
                        htmlFor="signinLoginId"
                      >
                        Login ID
                      </label>
                      <div className="relative flex items-center">
                        <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="signinLoginId"
                          type="text"
                          required
                          value={signInLoginId}
                          onChange={(e) => {
                            setSignInLoginId(e.target.value);
                            if (showErrorNotice) setShowErrorNotice(false);
                          }}
                          placeholder="Enter your Login ID"
                          className="h-12 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>

                    {/* Field: Password */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-xs font-medium text-foreground sm:text-sm"
                          htmlFor="signinPassword"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline active:opacity-80 dark:text-primary-400"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <Key className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="signinPassword"
                          type={showSignInPassword ? "text" : "password"}
                          required
                          value={signInPassword}
                          onChange={(e) => {
                            setSignInPassword(e.target.value);
                            if (showErrorNotice) setShowErrorNotice(false);
                          }}
                          placeholder="Enter your Password"
                          className="h-12 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          aria-label={showSignInPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowSignInPassword((prev) => !prev)}
                          className="absolute right-3 flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
                        >
                          {showSignInPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me Checkbox */}
                    <label
                      htmlFor={rememberMeId}
                      className="flex cursor-pointer items-center gap-2 select-none py-1"
                    >
                      <input
                        id={rememberMeId}
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        Keep me logged in on this device
                      </span>
                    </label>

                    {/* Primary Submit Action */}
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 font-semibold tracking-wide text-white shadow-sm transition-all duration-150 hover:bg-primary-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      <span>SIGN IN</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </form>
                </div>

                {/* Footer Controls & Wireframe Specs */}
                <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-4">
                  {/* Demo trigger for UX verification */}
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={simulateLoginError}
                      className="flex items-center gap-1 font-mono text-muted-foreground transition-colors hover:text-destructive active:scale-95"
                    >
                      <Bug className="h-3.5 w-3.5" />
                      <span>Simulate Auth Error State</span>
                    </button>
                    <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                      <Shield className="h-3.5 w-3.5" />
                      <span>FIPS 140-3</span>
                    </span>
                  </div>

                  {/* Alternate Switcher Prompt */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("signup");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="font-semibold text-primary-600 hover:underline active:opacity-80 dark:text-primary-400 ml-1"
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* SUB-VIEW 2: SIGN UP CARD */}
            {/* ----------------------------------------------------------------- */}
            {showSignUpView && (
              <div
                className="flex w-full flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 shadow-md transition-all duration-200 hover:shadow-lg sm:p-7"
                id="viewSignUp"
              >
                <div className="flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Create Account
                      </h1>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Enter credentials conforming to security architecture
                    </p>
                  </div>

                  {/* Form */}
                  <form className="mt-1 flex flex-col gap-3.5" onSubmit={handleSignUpSubmit}>
                    {/* Field 1: Login ID with Character Count */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-xs font-medium text-foreground sm:text-sm"
                          htmlFor="signupLoginId"
                        >
                          Login Id
                        </label>
                        <span
                          className={`font-mono text-xs font-medium transition-colors ${
                            isLoginIdValid
                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                              : loginIdCount > 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {loginIdCount}/12
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <AtSign className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="signupLoginId"
                          type="text"
                          required
                          maxLength={12}
                          value={signUpLoginId}
                          onChange={(e) => setSignUpLoginId(e.target.value)}
                          placeholder="Choose a unique Login ID"
                          className="h-12 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                        />
                        <div className="pointer-events-none absolute right-3">
                          {isLoginIdValid && (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        6-12 characters, unique handle
                      </span>
                    </div>

                    {/* Field 2: Email ID */}
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-xs font-medium text-foreground sm:text-sm"
                        htmlFor="signupEmail"
                      >
                        Email Id
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="signupEmail"
                          type="email"
                          required
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="Enter corporate or personal Email ID"
                          className="h-12 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                        />
                        <div className="pointer-events-none absolute right-3">
                          {isEmailValid && (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Unique identifier in database
                      </span>
                    </div>

                    {/* Field 3: Password with Live Checklist */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-medium text-foreground sm:text-sm"
                        htmlFor="signupPassword"
                      >
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="signupPassword"
                          type={showSignUpPassword ? "text" : "password"}
                          required
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="Create strong passphrase"
                          className="h-12 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowSignUpPassword((prev) => !prev)}
                          className="absolute right-3 flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
                        >
                          {showSignUpPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Dynamic Security Rules Pill Grid (2x2) */}
                      <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-lg border border-border/70 bg-muted/50 p-2.5">
                        <div
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ruleLength
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ruleLength ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="font-mono text-[11px]">&gt; 8 characters</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ruleLower
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ruleLower ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="font-mono text-[11px]">One lowercase</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ruleUpper
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ruleUpper ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="font-mono text-[11px]">One uppercase</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ruleSpecial
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ruleSpecial ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="font-mono text-[11px]">One special symbol</span>
                        </div>
                      </div>
                    </div>

                    {/* Field 4: Re-Enter Password */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-xs font-medium text-foreground sm:text-sm"
                          htmlFor="signupConfirmPassword"
                        >
                          Re-Enter Password
                        </label>
                        {hasConfirmPassword && (
                          <span
                            className={`font-mono text-xs font-semibold ${
                              passwordsMatch
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {passwordsMatch ? "Passwords Match" : "Mismatch"}
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <ShieldCheck className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="signupConfirmPassword"
                          type={showSignUpConfirmPassword ? "text" : "password"}
                          required
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          placeholder="Re-enter password for verification"
                          className="h-12 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          aria-label={
                            showSignUpConfirmPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowSignUpConfirmPassword((prev) => !prev)}
                          className="absolute right-3 flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
                        >
                          {showSignUpConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Primary Submit Action */}
                    <button
                      type="submit"
                      className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 font-semibold tracking-wide text-white shadow-sm transition-all duration-150 hover:bg-primary-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      <span>SIGN UP</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </form>
                </div>

                {/* Footer Switcher Prompt */}
                <div className="mt-6 border-t border-border/60 pt-4 text-center">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("signin");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="font-semibold text-primary-600 hover:underline active:opacity-80 dark:text-primary-400 ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Wireframe Specification & System Reference Card */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Nova Security Center</span>
              <span className="font-mono text-[11px] text-muted-foreground">SOC v4.2 Verification</span>
            </div>
            <button
              type="button"
              onClick={() =>
                triggerToast(
                  "Connecting to Nova ID 24/7 Security Operations Center...",
                  "info"
                )
              }
              className="rounded-lg px-3 py-1.5 font-mono text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 active:scale-95 dark:text-primary-400 dark:hover:bg-primary-950/60"
            >
              Support
            </button>
          </div>
        </div>

        {/* Floating Toast Notification (Matching Stitch mobile bottom toast) */}
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-xl border border-border/70 bg-foreground/95 px-4 py-3 text-background shadow-lg backdrop-blur-md transition-all duration-300 ${
            floatingToast.visible
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "pointer-events-none translate-y-16 opacity-0"
          }`}
        >
          {floatingToast.type === "error" ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          ) : floatingToast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <Info className="h-5 w-5 shrink-0 text-sky-400" />
          )}
          <span className="flex-1 text-xs font-medium leading-snug sm:text-sm">
            {floatingToast.message}
          </span>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => setFloatingToast((prev) => ({ ...prev, visible: false }))}
            className="p-1 text-background/70 hover:text-background active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </main>
    </div>
  );
}


