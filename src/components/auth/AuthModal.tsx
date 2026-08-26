"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type AuthTab = "login" | "register";
type LoginRole = "admin" | "user";

const LOGIN_ROLE_LABEL: Record<LoginRole, string> = {
  admin: "Admin",
  user: "Mẹ bỉm",
};

const inputCls =
  "w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2.5 text-sm outline-none focus:border-[#E8547A] focus:bg-white";
const submitCls =
  "mt-1 w-full rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] py-3 text-sm font-bold text-white disabled:opacity-60";

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

// Modal đăng nhập/đăng ký — lối duy nhất để đăng nhập/đăng ký trong hệ thống
// (không còn trang /dang-nhap, /dang-ky riêng). Gọi lại đúng 2 API đã có sẵn
// (UC-01), không có logic xác thực riêng ở đây — modal chỉ là lớp giao diện.
export function AuthModal({
  open,
  onClose,
  defaultTab = "login",
  redirectTo,
}: {
  open: boolean;
  onClose: () => void;
  defaultTab?: AuthTab;
  /** Đích đến sau khi đăng nhập thành công (vd: middleware chặn /admin, /tai-khoan). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>(defaultTab);

  const [loginRole, setLoginRole] = useState<LoginRole>("admin");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setLoginRole("admin");
      setError(null);
      setNotice(null);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function switchTab(next: AuthTab) {
    setTab(next);
    setError(null);
    setNotice(null);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đăng nhập thất bại.");

        return;
      }

      // Vai trò thật luôn lấy từ tài khoản trong DB (data.user.role), không
      // phải từ nút chọn — nút chọn chỉ để KHỚP đúng cổng đăng nhập. Nếu tài
      // khoản không đúng vai trò đã chọn, huỷ ngay phiên vừa tạo (đăng xuất)
      // thay vì âm thầm cho vào nhầm khu vực.
      const actualRole: LoginRole = data.user?.role === "admin" ? "admin" : "user";

      if (actualRole !== loginRole) {
        await fetch("/api/auth/logout", { method: "POST" });
        setError(
          `Tài khoản này là ${LOGIN_ROLE_LABEL[actualRole]}, không phải ${LOGIN_ROLE_LABEL[loginRole]}. Hãy chọn đúng vai trò rồi thử lại.`,
        );

        return;
      }

      onClose();
      router.refresh();

      if (redirectTo) {
        router.push(redirectTo);
      } else if (actualRole === "admin") {
        router.push("/admin");
      }
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          full_name: regFullName,
          phone: regPhone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đăng ký thất bại.");

        return;
      }

      if (!data.session_created) {
        setNotice(
          "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.",
        );

        return;
      }

      onClose();
      router.refresh();

      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F172A]/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E8547A] to-[#0D9488]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] hover:text-[#E8547A]"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="font-serif text-xl font-black text-[#0F172A]">
            Sữa<em className="not-italic text-[#E8547A]">Embe</em>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">
            {tab === "login" ? "Đăng nhập hệ thống" : "Tạo tài khoản mẹ bỉm"}
          </p>
        </div>

        {tab === "login" ? (
          <form className="mt-5 flex flex-col gap-3" onSubmit={handleLogin}>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLoginRole("admin")}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  loginRole === "admin"
                    ? "border-[#0F172A] bg-[#0F172A] text-white"
                    : "border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                ⚙ Admin
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("user")}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  loginRole === "user"
                    ? "border-[#0F172A] bg-[#0F172A] text-white"
                    : "border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                👩 Mẹ bỉm
              </button>
            </div>

            <ModalField label="Email">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={inputCls}
              />
            </ModalField>
            <ModalField label="Mật khẩu">
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputCls}
              />
            </ModalField>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? "Đang xử lý..." : "Đăng nhập →"}
            </button>

            <p className="text-center text-xs text-[#64748B]">
              Bạn chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => switchTab("register")}
                className="font-bold text-[#E8547A] hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </form>
        ) : (
          <form className="mt-5 flex flex-col gap-3" onSubmit={handleRegister}>
            <ModalField label="Email">
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputCls}
              />
            </ModalField>
            <ModalField label="Mật khẩu (tối thiểu 8 ký tự)">
              <input
                type="password"
                required
                minLength={8}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={inputCls}
              />
            </ModalField>
            <ModalField label="Họ tên (không bắt buộc)">
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className={inputCls}
              />
            </ModalField>
            <ModalField label="Số điện thoại (không bắt buộc)">
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className={inputCls}
              />
            </ModalField>

            {error && <p className="text-xs text-red-600">{error}</p>}
            {notice && <p className="text-xs text-emerald-600">{notice}</p>}

            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? "Đang xử lý..." : "Đăng ký →"}
            </button>

            <p className="text-center text-xs text-[#64748B]">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => switchTab("login")}
                className="font-bold text-[#E8547A] hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
