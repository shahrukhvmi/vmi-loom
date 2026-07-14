import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../services/authService";
import { useAuthStore } from "../context/authStore";

export function AuthPage() {
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isRegister = mode === "register";

  const handleSubmit = async () => {
    // Basic validation
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }
    if (isRegister && !form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = isRegister
        ? await authService.register(form.name, form.email, form.password)
        : await authService.login(form.email, form.password);

      const token = res.data.data.token;
      const user = res.data.data.user;
      setAuth(user, token);
      toast.success(
        isRegister
          ? `Welcome, ${user?.name || "there"}! 🎉`
          : `Welcome back, ${user?.name || "there"}!`,
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (isRegister ? "Registration failed" : "Login failed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setForm({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f8fa] px-4">
      {/* Card */}
      <div
        className="w-full max-w-[400px] bg-white rounded-[24px] border border-[#ebebf0] p-8"
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-[11px] bg-[#7c3aed] flex items-center justify-center"
            style={{ boxShadow: "0 4px 14px rgba(124,58,237,.35)" }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/90" />
          </div>
          <span className="text-[18px] font-bold tracking-[-0.02em] text-[#1a1a2e]">
            Record
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1a1a2e] tracking-[-0.02em]">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-[#8c8ca3] mt-1">
            {isRegister
              ? "Start recording in seconds"
              : "Sign in to continue to Record"}
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {isRegister && (
            <Field label="Full name">
              <input
                type="text"
                placeholder="Muhammad Usman"
                value={form.name}
                onChange={set("name")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus={isRegister}
                className="input-field"
              />
            </Field>
          )}

          <Field label="Email address">
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus={!isRegister}
              className="input-field"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder={isRegister ? "Min. 8 characters" : "••••••••"}
                value={form.password}
                onChange={set("password")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8ca3] hover:text-[#555570] transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 py-3 rounded-[14px] text-[14px] font-semibold text-white
            bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6]
            transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none
            flex items-center justify-center gap-2"
          style={{ boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />{" "}
              {isRegister ? "Creating account…" : "Signing in…"}
            </>
          ) : isRegister ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#ebebf0]" />
          <span className="text-[12px] text-[#8c8ca3]">or</span>
          <div className="flex-1 h-px bg-[#ebebf0]" />
        </div>

        {/* Switch mode */}
        <p className="text-center text-[13px] text-[#8c8ca3]">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={switchMode}
            className="text-[#7c3aed] font-semibold hover:underline transition-all"
          >
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>

      <p className="mt-6 text-[12px] text-[#8c8ca3]">
        Record · Browser-native screen recorder
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#555570] mb-1.5 uppercase tracking-[0.06em]">
        {label}
      </label>
      {children}
    </div>
  );
}
