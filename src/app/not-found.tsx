import Link from "next/link";

import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Next.js App Router tự dùng file này cho mọi route không khớp (404) và khi
// gọi notFound() thủ công — giữ nguyên header/footer + branding SuaEmbe thay
// vì trang 404 trắng mặc định của Next.js.
export default async function NotFound() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  return (
    <main className="flex min-h-screen flex-col bg-[#FDF8FA]">
      <SiteNav profile={profile} />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="font-serif text-7xl font-black text-[#E8547A]">404</span>
        <h1 className="mt-4 text-xl font-bold text-[#1E293B]">Không tìm thấy trang này</h1>
        <p className="mt-2 max-w-md text-sm text-[#64748B]">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi. Kiểm tra lại URL hoặc quay về trang chủ.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-[#E8547A] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#D8456B]"
        >
          ← Về trang chủ
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}
