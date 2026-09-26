"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Columns,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  KeyRound,
  LayoutGrid,
  Lock,
  LogIn,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

type AuthTab = "login" | "signup";

interface ToastState {
  visible: boolean;
  title: string;
  message: string;
  isError: boolean;
}

export default function IdentityPortalPage() {
  const theme = useTheme();

  // Layout & Navigation State
  const [isSideBySide, setIsSideBySide] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  // Login Form State
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Sign Up Form State
  const [signupLoginId, setSignupLoginId] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // In-app Custom Toast State (matches Stitch visual design)
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    title: "",
    message: "",
    isError: false,
  });

  const rememberMeId = useId();
  const termsId = useId();

  // Screen responsiveness listener
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileScreen(isMobile);
      if (isMobile) {
        setIsSideBySide(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toast Helper
  const triggerToast = (title: string, message: string, isError = false) => {
    setToast({ visible: true, title, message, isError });
    if (isError) {
      showErrorToast(new Error(message), title);
    } else {
      showSuccessToast(message, { title });
    }
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Validation rules for Sign Up Login ID (6-12 chars)
  const isLoginIdValid = signupLoginId.length >= 6 && signupLoginId.length <= 12;

  // Validation rules for Sign Up Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isDuplicateEmail = signupEmail.trim().toLowerCase() === "existing@domain.com";
  const isEmailValid = emailRegex.test(signupEmail.trim()) && !isDuplicateEmail;

  // Validation rules for Sign Up Password
  const pwdLengthValid = signupPassword.length > 8;
  const pwdCaseValid = /[a-z]/.test(signupPassword) && /[A-Z]/.test(signupPassword);
  const pwdSpecialValid = /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword);
  const pwdUniqueValid =
    signupPassword.length > 0 &&
    !["password", "12345678", "admin123", "password123"].includes(signupPassword.toLowerCase());

  const allPasswordRulesMet =
    pwdLengthValid && pwdCaseValid && pwdSpecialValid && pwdUniqueValid;

  // Confirm password validation
  const passwordsMatch =
    signupConfirmPassword.length > 0 && signupPassword === signupConfirmPassword;
  const passwordMismatch =
    signupConfirmPassword.length > 0 && signupPassword !== signupConfirmPassword;

  // Handle Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check credentials (accepts 'admin' / 'Admin@123' or any valid format for demonstration)
    if (
      (loginId.trim().toLowerCase() === "admin" && loginPassword === "Admin@123") ||
      (loginId.trim().length >= 4 && loginPassword.length >= 6 && !loginId.toLowerCase().includes("fail"))
    ) {
      setLoginError(false);
      triggerToast(
        "Login Successful",
        `Welcome back to the Nova precision console, ${loginId}!`
      );
    } else {
      setLoginError(true);
      triggerToast(
        "Authentication Failed",
        "Invalid Login Id or Password. Please verify and try again.",
        true
      );
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerToast(
      "Password Reset",
      "Password recovery instructions have been dispatched to your verified email."
    );
  };

  // Handle Sign Up Submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoginIdValid) {
      triggerToast(
        "Validation Error",
        "Login ID must be between 6 and 12 characters.",
        true
      );
      return;
    }

    if (isDuplicateEmail) {
      triggerToast(
        "Email Already Registered",
        "This email is already in the database. Please use a different email.",
        true
      );
      return;
    }

    if (!isEmailValid) {
      triggerToast("Invalid Email", "Please enter a valid email address.", true);
      return;
    }

    if (!allPasswordRulesMet) {
      triggerToast(
        "Weak Password",
        "Please satisfy all password complexity criteria.",
        true
      );
      return;
    }

    if (!passwordsMatch) {
      triggerToast(
        "Password Mismatch",
        "Please ensure both password entries match before submitting.",
        true
      );
      return;
    }

    if (!agreedToTerms) {
      triggerToast(
        "Terms Required",
        "You must agree to the Terms of Service and Privacy Policy.",
        true
      );
      return;
    }

    triggerToast(
      "Account Created!",
      `Registration successful for ${signupLoginId}. Please sign in now.`
    );

    // Prefill Login ID and switch to Login view
    setLoginId(signupLoginId);
    setTimeout(() => {
      setActiveTab("login");
      if (isMobileScreen) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 1200);
  };

  // Determine which cards to show
  const showBothSideBySide = isSideBySide && !isMobileScreen;
  const showLoginCard = showBothSideBySide || activeTab === "login";
  const showSignUpCard = showBothSideBySide || activeTab === "signup";

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-foreground selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300">
      {/* ========================================================================= */}
      {/* BEGIN: MainHeader */}
      {/* ========================================================================= */}
      <header
        className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/70 backdrop-blur-md transition-colors duration-300"
        data-purpose="navigation-header"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* App Branding Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 via-primary-600 to-sky-400 text-white shadow-m3-1">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                Nova<span className="text-primary-600 dark:text-primary-400">ID</span>
                <span className="rounded-full border border-primary-200/60 bg-primary-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary-600 dark:border-primary-800/40 dark:bg-primary-950/70 dark:text-primary-400">
                  Auth v4.2
                </span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Wireframe Reference Implementation
              </span>
            </div>
          </div>

          {/* Action items: View Layout Switcher & Dark/Light Mode */}
          <div className="flex items-center gap-3">
            {/* Live Layout Switcher (Side-by-Side vs Tabbed Focus) on Large Screens */}
            {!isMobileScreen && (
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsSideBySide((prev) => !prev)}
                title="Toggle Side-by-Side or Tabbed Layout"
              >
                {isSideBySide ? (
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Columns className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{isSideBySide ? "Tabbed Focus View" : "Side-by-Side View"}</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              aria-label="Toggle Dark Mode"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      {/* END: MainHeader */}

      {/* ========================================================================= */}
      {/* BEGIN: MainContent */}
      {/* ========================================================================= */}
      <main
        className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12"
        data-purpose="authentication-container"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          {/* Flow Descriptor Wireframe Header */}
          <div className="mb-8 max-w-xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Identity Portal
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Single sign-on and high-assurance credential authentication architecture.
            </p>
          </div>

          {/* Global Segmented Navigation Control (Visible in Tabbed Mode or Mobile) */}
          {(!showBothSideBySide || isMobileScreen) && (
            <div
              className="mb-8 flex w-full max-w-md items-center justify-between rounded-2xl border border-border bg-muted/70 p-1.5 backdrop-blur transition-all duration-300 dark:bg-muted/30"
              id="tabNavigationControls"
            >
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === "login"
                    ? "bg-card font-semibold text-primary-600 shadow-sm dark:text-primary-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("login")}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === "signup"
                    ? "bg-card font-semibold text-primary-600 shadow-sm dark:text-primary-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("signup")}
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Container: Side-by-Side or Centered Tabbed Card */}
          <div
            className={`flex w-full flex-col items-stretch justify-center gap-8 transition-all duration-300 ${
              showBothSideBySide ? "lg:max-w-5xl lg:flex-row" : "max-w-md"
            }`}
          >
            {/* ========================================================================= */}
            {/* BEGIN: LoginCard */}
            {/* ========================================================================= */}
            {showLoginCard && (
              <div
                className="flex w-full flex-1 flex-col rounded-2xl border border-border bg-card shadow-m3-1 transition-all duration-200 hover:shadow-m3-2"
                data-purpose="login-card"
              >
                {/* Card Header with Wireframe Logo Box */}
                <div className="flex flex-col items-center border-b border-border/50 p-6 pb-4 text-center sm:p-8">
                  <div className="mb-4 flex h-14 w-16 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-600 shadow-inner dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-400">
                    <Fingerprint className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Welcome Back
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sign in with your verified credentials
                  </p>
                </div>

                {/* Card Content / Login Form */}
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                  {/* Error Alert Area */}
                  {loginError && (
                    <div
                      className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                      <div className="flex-1">
                        <span className="block text-sm font-semibold">
                          Authentication Failed
                        </span>
                        <span className="text-xs">
                          Invalid Login Id or Password. Please verify and try again.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                        onClick={() => setLoginError(false)}
                        aria-label="Dismiss error"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleLoginSubmit}>
                    {/* Login Id Field */}
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-medium text-foreground"
                        htmlFor="loginUserId"
                      >
                        Login Id <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                          <User className="h-4 w-4" />
                        </div>
                        <input
                          id="loginUserId"
                          type="text"
                          required
                          value={loginId}
                          onChange={(e) => {
                            setLoginId(e.target.value);
                            if (loginError) setLoginError(false);
                          }}
                          placeholder="Enter your Login ID"
                          className="block w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          className="block text-sm font-medium text-foreground"
                          htmlFor="loginPassword"
                        >
                          Password <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="loginPassword"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginError) setLoginError(false);
                          }}
                          placeholder="Enter your password"
                          className="block w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                        <button
                          type="button"
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Device Checkbox */}
                    <div className="flex items-center pt-1">
                      <input
                        id={rememberMeId}
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-background text-primary-600 focus:ring-primary-500"
                      />
                      <label
                        htmlFor={rememberMeId}
                        className="ml-2.5 block select-none text-xs text-muted-foreground"
                      >
                        Keep me logged in on this browser
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 px-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        <span>SIGN IN</span>
                        <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </form>

                  {/* Card Footer Switcher */}
                  <div className="mt-8 border-t border-border/60 pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("signup");
                          if (isMobileScreen) {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="ml-1 inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline dark:text-primary-400"
                      >
                        <span>Sign Up</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* END: LoginCard */}

            {/* ========================================================================= */}
            {/* BEGIN: SignUpCard */}
            {/* ========================================================================= */}
            {showSignUpCard && (
              <div
                className="flex w-full flex-1 flex-col rounded-2xl border border-border bg-card shadow-m3-1 transition-all duration-200 hover:shadow-m3-2"
                data-purpose="signup-card"
              >
                {/* Card Header with Wireframe Logo Box */}
                <div className="flex flex-col items-center border-b border-border/50 p-6 pb-4 text-center sm:p-8">
                  <div className="mb-4 flex h-14 w-16 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 shadow-inner dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400">
                    <UserCheck className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Create New Account
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Join the network and securely manage access
                  </p>
                </div>

                {/* Card Content / Sign Up Form */}
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                  <form className="space-y-4" onSubmit={handleSignupSubmit}>
                    {/* 1. Enter Login Id (6-12 chars) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          className="block text-sm font-medium text-foreground"
                          htmlFor="signupLoginId"
                        >
                          Enter Login Id <span className="text-red-500">*</span>
                        </label>
                        <span
                          className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-colors ${
                            isLoginIdValid
                              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {signupLoginId.length}/12
                        </span>
                      </div>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                          <AtSign className="h-4 w-4" />
                        </div>
                        <input
                          id="signupLoginId"
                          type="text"
                          required
                          maxLength={12}
                          value={signupLoginId}
                          onChange={(e) => setSignupLoginId(e.target.value)}
                          placeholder="e.g. john_doe99"
                          className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                          {isLoginIdValid && (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span>Must be unique and between 6-12 characters.</span>
                      </p>
                    </div>

                    {/* 2. Enter Email Id */}
                    <div className="space-y-1.5">
                      <label
                        className="block text-sm font-medium text-foreground"
                        htmlFor="signupEmail"
                      >
                        Enter Email Id <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="signupEmail"
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                          {isDuplicateEmail && (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          {!isDuplicateEmail && isEmailValid && (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isDuplicateEmail ? (
                          <span className="font-medium text-red-600 dark:text-red-400">
                            This email is already registered in database.
                          </span>
                        ) : isEmailValid ? (
                          <span className="font-medium text-green-600 dark:text-green-400">
                            Email is available and formatted correctly.
                          </span>
                        ) : (
                          <>
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            <span>Must not be a duplicate in database.</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* 3. Enter Password with Requirements */}
                    <div className="space-y-1.5">
                      <label
                        className="block text-sm font-medium text-foreground"
                        htmlFor="signupPassword"
                      >
                        Enter Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <input
                          id="signupPassword"
                          type={showSignupPassword ? "text" : "password"}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Create complex password"
                          className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                        <button
                          type="button"
                          aria-label={
                            showSignupPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showSignupPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Requirements Checklist Badges */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-xs text-muted-foreground">
                        <div
                          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                            pwdLengthValid
                              ? "font-medium text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {pwdLengthValid ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0" />
                          )}
                          <span>&gt; 8 characters</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                            pwdCaseValid
                              ? "font-medium text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {pwdCaseValid ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0" />
                          )}
                          <span>Lower &amp; Upper case</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                            pwdSpecialValid
                              ? "font-medium text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {pwdSpecialValid ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0" />
                          )}
                          <span>Special character (!@#$)</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                            pwdUniqueValid
                              ? "font-medium text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {pwdUniqueValid ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0" />
                          )}
                          <span>Unique &amp; non-common</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Re-Enter Password */}
                    <div className="space-y-1.5">
                      <label
                        className="block text-sm font-medium text-foreground"
                        htmlFor="signupConfirmPassword"
                      >
                        Re-Enter Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="signupConfirmPassword"
                          type={showSignupConfirmPassword ? "text" : "password"}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Repeat password to verify"
                          className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                        <button
                          type="button"
                          aria-label={
                            showSignupConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showSignupConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {passwordsMatch && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Check className="h-3.5 w-3.5" />
                          <span>Passwords match.</span>
                        </p>
                      )}

                      {passwordMismatch && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                          <X className="h-3.5 w-3.5" />
                          <span>Passwords do not match.</span>
                        </p>
                      )}
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start pt-2">
                      <input
                        id={termsId}
                        name="terms"
                        type="checkbox"
                        required
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border bg-background text-primary-600 focus:ring-primary-500"
                      />
                      <label
                        htmlFor={termsId}
                        className="ml-2.5 block select-none text-xs text-muted-foreground"
                      >
                        I agree to the{" "}
                        <Link href="#terms" className="text-primary-600 hover:underline dark:text-primary-400">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="#privacy" className="text-primary-600 hover:underline dark:text-primary-400">
                          Privacy Policy
                        </Link>
                        .
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 px-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        <span>SIGN UP</span>
                        <UserPlus className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </form>

                  {/* Card Footer Switcher */}
                  <div className="mt-8 border-t border-border/60 pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("login");
                          if (isMobileScreen) {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="ml-1 inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline dark:text-primary-400"
                      >
                        <span>Sign In</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* END: SignUpCard */}
          </div>
        </div>

        {/* Feedback / Success Toast Notification matching wireframe */}
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-m3-3 transition-all duration-300 ${
            toast.visible
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "pointer-events-none translate-y-24 opacity-0"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              toast.isError
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
            }`}
          >
            {toast.isError ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">{toast.title}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </main>
      {/* END: MainContent */}

      {/* ========================================================================= */}
      {/* BEGIN: MainFooter */}
      {/* ========================================================================= */}
      <footer
        className="w-full border-t border-border py-6 text-center text-xs text-muted-foreground"
        data-purpose="page-footer"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Nova Precision UI</span>
            <span>&bull;</span>
            <span>Strict Wireframe Compliance</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="#help"
              className="transition-colors hover:text-foreground"
            >
              Documentation
            </Link>
            <Link
              href="#security"
              className="transition-colors hover:text-foreground"
            >
              Security Whitepaper
            </Link>
            <Link
              href="#contact"
              className="transition-colors hover:text-foreground"
            >
              Support Desk
            </Link>
          </div>
        </div>
      </footer>
      {/* END: MainFooter */}
    </div>
  );
}

