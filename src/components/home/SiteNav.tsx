"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthModal } from "@/components/auth/AuthModal";
import type { UserProfile } from "@/lib/auth/types";

interface NavGroup {
  label: string;
  href: string;
}

// Các nhóm điều hướng khớp với demo suaembe.html, nhưng không dùng submenu
// dạng dropdown nữa — mỗi mục bấm thẳng vào trang thật tương ứng (đã triển
// khai đủ). "🤖 Công cụ cho Mẹ" trỏ /cong-cu-cho-me (1 trang duy nhất với bộ
// chọn công cụ bên trong: AI gợi ý sữa, tính ngày dự sinh, cẩm nang sinh con
// — không phải nhiều trang con). Nhật ký Dinh dưỡng Bé (UC-04/05/06, tab thứ
// 3 của /tin-tuc?tab=nhatky) không có mục riêng trên nav chính — truy cập
// qua /tai-khoan hoặc footer. "🤝 Đối tác" cố tình KHÔNG nằm trong mảng này —
// render riêng ở cuối cùng (sau "Tin tức Mẹ & Bé") theo đúng thứ tự yêu cầu.
const NAV_GROUPS: NavGroup[] = [
  { label: "🤖 Công cụ cho Mẹ", href: "/cong-cu-cho-me" },
  { label: "♻️ Chợ Mẹ & Bé", href: "/cho-me-be" },
  { label: "🛍 Bách Hóa Mẹ & Bé", href: "/bach-hoa" },
];

// Chỉ highlight đúng 1 mục đang khớp màn hình hiện tại (không phải luôn tô
// hồng "Trang chủ" bất kể đang ở trang nào) — mục khác chỉ đổi màu khi hover.
function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean): string {
  return active
    ? "rounded-lg bg-[#E8547A]/10 px-3 py-1.5 text-[13px] font-semibold text-[#E8547A]"
    : "rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#64748B] hover:bg-[#E8547A]/10 hover:text-[#E8547A]";
}

export function SiteNav({
  profile,
  autoOpenLogin = false,
  redirectAfterLogin,
}: {
  profile: UserProfile | null;
  /** true khi bị middleware/trang cần đăng nhập điều hướng về đây (?login=1). */
  autoOpenLogin?: boolean;
  /** Đích đến sau khi đăng nhập thành công, ví dụ /admin, /tai-khoan (?redirect=...). */
  redirectAfterLogin?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function openAuth(tab: "login" | "register") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  // Middleware/trang riêng tư (vd /admin, /tai-khoan) điều hướng người chưa
  // đăng nhập về đây kèm ?login=1&redirect=... — tự mở modal thay vì phải bấm
  // lại, rồi dọn query khỏi URL để F5 không mở lại modal.
  useEffect(() => {
    if (autoOpenLogin && !profile) {
      openAuth("login");
      router.replace("/", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setUserMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Không dùng backdrop-blur ở đây dù trước đây có — tổ hợp
          "sticky" + "backdrop-filter" là lỗi dựng hình đã biết của
          Chrome/Edge: ở 1 số mức zoom trình duyệt khác 100%, lớp compositing
          phụ mà backdrop-filter cần không được vẽ lại đúng lúc khi cuộn,
          khiến thanh nav biến mất tạm thời. Nền gần như đặc (bg-white/98,
          không blur) giữ được hiệu ứng tương tự mà không kích hoạt bug này. */}
      <nav className="sticky top-0 z-[100] flex min-h-16 flex-wrap items-center gap-2 border-b border-black/10 bg-white/98 px-4 sm:px-6">
        <Link href="/" className="mr-0 flex min-w-0 shrink items-center gap-2 sm:mr-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#E8547A] to-[#C43A62] text-lg">
            🍼
          </div>
          <div className="truncate font-serif text-base font-black text-[#0F172A] sm:text-lg">
            Sữa<em className="not-italic text-[#E8547A]">Embe</em>
          </div>
        </Link>

        <div className="hidden flex-1 items-center gap-1 lg:flex">
          <Link href="/" className={navLinkClass(isActiveHref(pathname, "/"))}>
            Trang chủ
          </Link>

          {NAV_GROUPS.map((group) => (
            <Link key={group.label} href={group.href} className={navLinkClass(isActiveHref(pathname, group.href))}>
              {group.label}
            </Link>
          ))}

          <Link href="/tin-tuc" className={navLinkClass(isActiveHref(pathname, "/tin-tuc"))}>
            📰 Tin tức Mẹ & Bé
          </Link>

          <Link href="/doi-tac" className={navLinkClass(isActiveHref(pathname, "/doi-tac"))}>
            🤝 Đối tác
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-site-menu"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="ml-auto flex shrink-0 items-center rounded-lg border border-[#CBD5E1] px-3 py-2 text-[12px] font-semibold text-[#475569] hover:border-[#E8547A] hover:text-[#E8547A] lg:hidden"
        >
          {mobileMenuOpen ? "Đóng" : "Menu"}
        </button>

        <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
          {profile ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-1.5 text-[13px] font-semibold text-[#0F172A] hover:border-[#E8547A]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8547A] text-[11px] font-bold text-white">
                  {(profile.full_name ?? profile.email).charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[9rem] truncate sm:max-w-[14rem]">{profile.full_name || profile.email}</span>
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setUserMenuOpen(false)}
                    className="fixed inset-0 z-[105] cursor-default"
                  />
                  <div className="absolute right-0 top-full z-[110] mt-2 flex w-52 flex-col gap-0.5 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl">
                    <Link
                      href="/tai-khoan"
                      onClick={() => setUserMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-[12.5px] text-[#64748B] hover:bg-[#E8547A]/10 hover:text-[#E8547A]"
                    >
                      Tài khoản
                    </Link>
                    {profile.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="rounded-lg px-3 py-2 text-[12.5px] text-[#64748B] hover:bg-[#E8547A]/10 hover:text-[#E8547A]"
                      >
                        Quản trị
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-lg px-3 py-2 text-left text-[12.5px] text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-[12.5px] font-semibold text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A]"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => openAuth("register")}
                className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2 text-[12.5px] font-bold text-white"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>

        {mobileMenuOpen && (
          <div id="mobile-site-menu" className="basis-full border-t border-black/10 py-3 lg:hidden">
            <div className="grid gap-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass(isActiveHref(pathname, "/"))}
              >
                Trang chủ
              </Link>
              {NAV_GROUPS.map((group) => (
                <Link
                  key={group.label}
                  href={group.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass(isActiveHref(pathname, group.href))}
                >
                  {group.label}
                </Link>
              ))}
              <Link
                href="/tin-tuc"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass(isActiveHref(pathname, "/tin-tuc"))}
              >
                📰 Tin tức Mẹ & Bé
              </Link>
              <Link
                href="/doi-tac"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass(isActiveHref(pathname, "/doi-tac"))}
              >
                🤝 Đối tác
              </Link>
            </div>

            <div className="mt-2 border-t border-black/10 pt-2">
              {profile ? (
                <div className="grid gap-1">
                  <Link
                    href="/tai-khoan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-[#64748B] hover:bg-[#E8547A]/10 hover:text-[#E8547A]"
                  >
                    Tài khoản
                  </Link>
                  {profile.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-[#64748B] hover:bg-[#E8547A]/10 hover:text-[#E8547A]"
                    >
                      Quản trị
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuth("login");
                    }}
                    className="rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-[12.5px] font-semibold text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A]"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuth("register");
                    }}
                    className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2 text-[12.5px] font-bold text-white"
                  >
                    Đăng ký
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
        redirectTo={redirectAfterLogin}
      />
    </>
  );
}
