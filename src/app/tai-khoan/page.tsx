import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/LogoutButton";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import type { Baby } from "@/lib/babies/types";
import type { C2cOrder } from "@/lib/catalog/types";
import type { ConsultRequest } from "@/lib/consult/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { BabiesManager } from "./BabiesManager";
import { MyConsultsSection } from "./MyConsultsSection";
import { MyOrdersSection } from "./MyOrdersSection";
import { NotificationSettings } from "./NotificationSettings";
import { ProfileForm } from "./ProfileForm";

// "Tài khoản" và "Hồ sơ bé" hợp nhất vào cùng 1 trang (trước đây tách 2
// route /tai-khoan và /tai-khoan/be) — dựng như 1 trang bình thường giống
// /cho-me-be, /bach-hoa: có SiteNav + khối tiêu đề ở trên, 2 form đặt song
// song bên dưới. Dropdown sau đăng nhập chỉ còn 1 mục "Tài khoản" trỏ vào đây.
export default async function TaiKhoanPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1&redirect=/tai-khoan");
  }

  const profile = await getUserProfile(supabase, user.id);

  if (!profile) {
    redirect("/?login=1&redirect=/tai-khoan");
  }

  const { data: babies } = await supabase
    .from("babies")
    .select(
      "id, user_id, name, gender, birth_date, weight_g, height_cm, head_cm, current_milk_stage, updated_at",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // UC-29 - Quản Lý Đơn Hàng Của Tôi.
  const { data: orders } = await supabase
    .from("c2c_orders")
    .select(
      "id, listing_id, buyer_name, buyer_phone, buyer_email, shipping_address, quantity, unit_price, total_amount, payment_method, payment_ref, payment_status, order_status, admin_note, created_at, updated_at, c2c_listings(id, title, images, status)",
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const { data: consults } = await supabase
    .from("consult_requests")
    .select(
      "id, user_id, bs_id, question, baby_age_months, answer, answered_at, forwarded_at, status, rating, created_at, bs_nhi(id, full_name, specialty, hospital, avatar_url, response_hours, verified)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <SiteNav profile={profile} />

      <div className="mx-auto max-w-[1120px] px-7 py-10">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
          <span className="h-px w-5 bg-[#E8547A]" /> Tài khoản của bạn
        </div>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 font-serif text-3xl font-black text-[#0F172A]">
              Chào mừng, <em className="not-italic text-[#E8547A]">{profile.full_name || profile.email}</em>
            </h1>
            <p className="text-sm text-[#64748B]">
              {profile.email} · Vai trò: {profile.role}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#0F172A]">Thông tin tài khoản</h2>
            <ProfileForm profile={profile} />
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#0F172A]">Hồ sơ bé</h2>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Quản lý hồ sơ bé để dùng cho theo dõi tăng trưởng, mốc phát triển và AI gợi ý sữa.
            </p>

            <BabiesManager initialBabies={(babies as Baby[] | null) ?? []} />
          </div>
        </div>

        <div className="mt-6">
          <NotificationSettings />
        </div>

        <div className="mt-6">
          <MyOrdersSection initialOrders={(orders as unknown as C2cOrder[] | null) ?? []} />
        </div>

        <div className="mt-6">
          <MyConsultsSection initialConsults={(consults as unknown as ConsultRequest[] | null) ?? []} />
        </div>

        <p className="mt-6 text-sm text-[#64748B]">
          Theo dõi chỉ số tăng trưởng WHO, mốc phát triển và lịch ăn của bé tại{" "}
          <Link href="/tin-tuc?tab=nhatky" className="font-semibold text-[#E8547A] hover:underline">
            Nhật ký Dinh dưỡng Bé →
          </Link>
        </p>
      </div>

      <SiteFooter />
    </main>
  );
}
