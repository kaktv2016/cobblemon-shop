"use client";

import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { startTransition, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register";

type AuthStageProps = {
  initialMode: AuthMode;
  callbackUrl?: string;
  registered?: boolean;
};

type RegisterFormState = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type ModeCopy = {
  eyebrow: string;
  title: string;
  description: string;
  footerPrompt: string;
  footerAction: string;
  submitIdle: string;
  submitBusy: string;
  accentClassName: string;
};

const authInputClassName =
  "h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-white placeholder:text-slate-500 focus-visible:border-cyan-300/30 focus-visible:ring-cyan-300/10";

const helperSlotClass = "min-h-[1.25rem] text-xs leading-5 text-slate-500";
const statusSlotClass = "min-h-[2rem] sm:min-h-[4.5rem]";
const formViewportClass =
  "flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2 [scrollbar-width:thin]";
const headerViewportClass =
  "relative shrink-0 overflow-hidden min-h-0 sm:min-h-[12.25rem] lg:min-h-[13rem]";
const formShellClass = "absolute inset-0 flex min-h-0 flex-col";

const authCopy: Record<AuthMode, ModeCopy> = {
  login: {
    eyebrow: "เข้าสู่ระบบผู้เล่น",
    title: "เข้าสู่ระบบ",
    description:
      "ใช้ชื่อผู้ใช้และรหัสผ่านเดียวกับในเกม Minecraft เพื่อเข้าสู่ร้านค้าและจัดการบัญชีของคุณ",
    footerPrompt: "ยังไม่มีบัญชี?",
    footerAction: "สร้างบัญชีใหม่",
    submitIdle: "เข้าสู่ระบบ",
    submitBusy: "กำลังเข้าสู่ระบบ...",
    accentClassName: "text-cyan-200/70",
  },
  register: {
    eyebrow: "สร้างบัญชีใหม่",
    title: "สมัครสมาชิก",
    description:
      "สร้างบัญชีที่ใช้ได้ทั้งในเว็บและในเกม Minecraft เซิร์ฟเวอร์ Cobblemon Divided",
    footerPrompt: "มีบัญชีอยู่แล้ว?",
    footerAction: "เข้าสู่ระบบ",
    submitIdle: "สร้างบัญชี",
    submitBusy: "กำลังสร้างบัญชี...",
    accentClassName: "text-amber-200/70",
  },
};

function EmptyHelper() {
  return <span aria-hidden="true">&nbsp;</span>;
}

function StatusBanner({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-[1.35rem] px-4 py-3 text-sm ${
        isSuccess
          ? "border border-emerald-400/18 bg-emerald-400/8 text-emerald-100"
          : "border border-red-400/18 bg-red-400/8 text-red-100"
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
          isSuccess ? "text-emerald-300" : "text-red-300"
        }`}
      />
      <span>{children}</span>
    </div>
  );
}

function ModeToggleButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#120827]"
    >
      {children}
    </button>
  );
}

function LoginFields({
  username,
  password,
  showPassword,
  setUsername,
  setPassword,
  setShowPassword,
}: {
  username: string;
  password: string;
  showPassword: boolean;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <label htmlFor="login-username" className="text-sm font-medium text-slate-200">
          ชื่อผู้ใช้
        </label>
        <Input
          id="login-username"
          type="text"
          placeholder="ชื่อผู้ใช้ในเกม"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          aria-describedby="login-username-help"
          className={authInputClassName}
        />
        <p id="login-username-help" className={helperSlotClass}>
          ใช้ชื่อผู้ใช้เดียวกับที่ใช้ในเกม Minecraft
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-medium text-slate-200">
            รหัสผ่าน
          </label>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            การเข้าถึงที่ปลอดภัย
          </span>
        </div>

        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="กรอกรหัสผ่านของคุณ"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            aria-describedby="login-password-help"
            className={`${authInputClassName} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400 transition-colors hover:border-white/14 hover:text-white"
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <p id="login-password-help" className={helperSlotClass}>
          <EmptyHelper />
        </p>
      </div>
    </div>
  );
}

function RegisterFields({
  form,
  showPassword,
  passwordMismatch,
  setForm,
  setShowPassword,
}: {
  form: RegisterFormState;
  showPassword: boolean;
  passwordMismatch: string;
  setForm: Dispatch<SetStateAction<RegisterFormState>>;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <label htmlFor="register-email" className="text-sm font-medium text-slate-200">
          อีเมล
        </label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          required
          aria-describedby="register-email-help"
          className={authInputClassName}
        />
        <p id="register-email-help" className={helperSlotClass}>
          ใช้อีเมลนี้ในการเข้าสู่ระบบและติดตามการสั่งซื้อของคุณ
        </p>
      </div>

      <div className="space-y-2.5">
        <label htmlFor="register-username" className="text-sm font-medium text-slate-200">
          ชื่อผู้ใช้
        </label>
        <Input
          id="register-username"
          type="text"
          placeholder="divided_trainer"
          value={form.username}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              username: event.target.value,
            }))
          }
          required
          minLength={3}
          maxLength={16}
          pattern="^[a-zA-Z0-9_]+$"
          aria-describedby="register-username-help"
          className={authInputClassName}
        />
        <p id="register-username-help" className={helperSlotClass}>
          ชื่อนี้ใช้เข้าเกม Minecraft ด้วย (3-16 ตัวอักษร, a-z, 0-9, _)
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="register-password"
            className="text-sm font-medium text-slate-200"
          >
            รหัสผ่าน
          </label>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            อย่างน้อย 8 ตัวอักษร
          </span>
        </div>

        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            required
            minLength={8}
            aria-describedby="register-password-help"
            className={`${authInputClassName} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400 transition-colors hover:border-white/14 hover:text-white"
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <p id="register-password-help" className={helperSlotClass}>
          รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
        </p>
      </div>

      <div className="space-y-2.5">
        <label
          htmlFor="register-confirm-password"
          className="text-sm font-medium text-slate-200"
        >
          ยืนยันรหัสผ่าน
        </label>
        <Input
          id="register-confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              confirmPassword: event.target.value,
            }))
          }
          required
          aria-describedby="register-confirm-password-help"
          className={authInputClassName}
        />
        <p
          id="register-confirm-password-help"
          className={`${helperSlotClass} ${
            passwordMismatch ? "text-red-300" : "text-slate-500"
          }`}
        >
          {passwordMismatch || <EmptyHelper />}
        </p>
      </div>
    </div>
  );
}

function HeaderPane({
  mode,
  copy,
  transitionProps,
}: {
  mode: AuthMode;
  copy: ModeCopy;
  transitionProps: {
    initial: { opacity: number; y?: number; scale?: number };
    animate: { opacity: number; y?: number; scale?: number };
    exit: { opacity: number; y?: number; scale?: number };
    transition: { duration: number; ease?: [number, number, number, number] };
  };
}) {
  return (
    <div className={headerViewportClass}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={mode}
          className="absolute inset-0"
          initial={transitionProps.initial}
          animate={transitionProps.animate}
          exit={transitionProps.exit}
          transition={transitionProps.transition}
        >
          <p className={`text-[11px] uppercase tracking-[0.28em] ${copy.accentClassName}`}>
            {copy.eyebrow}
          </p>

          <div className="mt-4">
            <h1
              id={mode === "login" ? "auth-login-title" : "auth-register-title"}
              className={`font-display font-semibold text-white ${
                mode === "login"
                  ? "text-[clamp(2.7rem,5.8vw,4.2rem)] leading-[0.92] tracking-[-0.05em]"
                  : "text-[clamp(2.35rem,4.8vw,3.7rem)] leading-[0.96] tracking-[-0.045em]"
              }`}
            >
              {copy.title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
              {copy.description}
            </p>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
}

export function AuthStage({
  initialMode,
  callbackUrl = "/",
  registered = false,
}: AuthStageProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [activeMode, setActiveMode] = useState<AuthMode>(initialMode);
  const [showRegisteredSuccess, setShowRegisteredSuccess] = useState(registered);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    if (callbackUrl.startsWith("/")) {
      router.prefetch(callbackUrl);
    }
  }, [callbackUrl, router]);

  const copy = authCopy[activeMode];
  const isLoginMode = activeMode === "login";

  const registerPasswordMismatch =
    registerForm.confirmPassword.length > 0 &&
    registerForm.password !== registerForm.confirmPassword
      ? "รหัสผ่านไม่ตรงกัน"
      : "";

  const motionInitial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 16, scale: 0.985 };
  const motionAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1 };
  const motionExit = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -12, scale: 0.985 };
  const motionTransition = shouldReduceMotion
    ? { duration: 0.16 }
    : {
        duration: 0.26,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      };

  function switchMode(nextMode: AuthMode) {
    setLoginError("");
    setRegisterError("");

    if (nextMode === "register") {
      setShowRegisteredSuccess(false);
    }

    startTransition(() => {
      setActiveMode(nextMode);
    });
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        username: loginUsername,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setLoginError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          username: registerForm.username,
          password: registerForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(
          data.error || "ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง"
        );
        return;
      }

      setShowRegisteredSuccess(true);
      setLoginUsername(registerForm.username);
      setLoginPassword("");
      setShowLoginPassword(false);
      setRegisterError("");

      startTransition(() => {
        setActiveMode("login");
      });
    } catch {
      setRegisterError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2 lg:pt-4">
        <HeaderPane
          mode={activeMode}
          copy={copy}
          transitionProps={{
            initial: motionInitial,
            animate: motionAnimate,
            exit: motionExit,
            transition: motionTransition,
          }}
        />

        <div className={`${statusSlotClass} shrink-0 pt-5`}>
          {isLoginMode ? (
            showRegisteredSuccess ? (
              <StatusBanner tone="success">
                บัญชีของคุณพร้อมแล้ว เข้าสู่ระบบเพื่อดำเนินการต่อ
              </StatusBanner>
            ) : loginError ? (
              <StatusBanner tone="error">{loginError}</StatusBanner>
            ) : null
          ) : registerError ? (
            <StatusBanner tone="error">{registerError}</StatusBanner>
          ) : null}
        </div>

        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {isLoginMode ? (
              <m.form
                key="login"
                onSubmit={handleLoginSubmit}
                aria-labelledby="auth-login-title"
                className={formShellClass}
                initial={motionInitial}
                animate={motionAnimate}
                exit={motionExit}
                transition={motionTransition}
              >
                <fieldset
                  disabled={loginLoading}
                  className="flex min-h-0 flex-1 flex-col border-0 p-0"
                >
                  <div className={formViewportClass}>
                    <LoginFields
                      username={loginUsername}
                      password={loginPassword}
                      showPassword={showLoginPassword}
                      setUsername={setLoginUsername}
                      setPassword={setLoginPassword}
                      setShowPassword={setShowLoginPassword}
                    />
                  </div>

                  <GlassButton
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={loginLoading}
                    className="mt-6 w-full shrink-0 rounded-2xl text-base font-semibold tracking-normal"
                  >
                    {loginLoading ? copy.submitBusy : copy.submitIdle}
                  </GlassButton>

                  <footer className="mt-6 shrink-0 border-t border-white/8 pt-5">
                    <p className="text-sm leading-7 text-slate-400">
                      {copy.footerPrompt}{" "}
                      <ModeToggleButton onClick={() => switchMode("register")}>
                        {copy.footerAction}
                      </ModeToggleButton>
                    </p>
                  </footer>
                </fieldset>
              </m.form>
            ) : (
              <m.form
                key="register"
                onSubmit={handleRegisterSubmit}
                aria-labelledby="auth-register-title"
                className={formShellClass}
                initial={motionInitial}
                animate={motionAnimate}
                exit={motionExit}
                transition={motionTransition}
              >
                <fieldset
                  disabled={registerLoading}
                  className="flex min-h-0 flex-1 flex-col border-0 p-0"
                >
                  <div className={formViewportClass}>
                    <RegisterFields
                      form={registerForm}
                      showPassword={showRegisterPassword}
                      passwordMismatch={registerPasswordMismatch}
                      setForm={setRegisterForm}
                      setShowPassword={setShowRegisterPassword}
                    />
                  </div>

                  <GlassButton
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={registerLoading}
                    className="mt-6 w-full shrink-0 rounded-2xl text-base font-semibold tracking-normal"
                  >
                    {registerLoading ? copy.submitBusy : copy.submitIdle}
                  </GlassButton>

                  <footer className="mt-6 shrink-0 border-t border-white/8 pt-5">
                    <p className="text-sm leading-7 text-slate-400">
                      {copy.footerPrompt}{" "}
                      <ModeToggleButton onClick={() => switchMode("login")}>
                        {copy.footerAction}
                      </ModeToggleButton>
                    </p>
                  </footer>
                </fieldset>
              </m.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </LazyMotion>
  );
}
