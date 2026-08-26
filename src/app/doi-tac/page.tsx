import { PartnerBrowser, type PartnerTab } from "@/components/partners/PartnerBrowser";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import type { PublicDoctor, PublicPartner, PublicPartnerService } from "@/lib/partners/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_TABS: PartnerTab[] = ["all", "hospital", "insurance", "doctor", "equipment", "service"];

// UC-17 - Xem đối tác và gói/dịch vụ. Chỉ lấy đối tác đã active + verified;
// các gói/dịch vụ và hồ sơ bác sĩ cũng áp dụng cùng quy tắc hiển thị public
// của database/RLS. ?tab=... cho phép deep-link thẳng vào 1 tab (vd footer
// "Hỏi BS Nhi" -> ?tab=doctor).
export default async function PartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { tab } = await searchParams;
  const initialTab: PartnerTab = VALID_TABS.includes(tab as PartnerTab) ? (tab as PartnerTab) : "all";
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  const [{ data: partnerRows }, { data: serviceRows }, { data: doctorRows }] = await Promise.all([
    supabase
      .from("partners")
      .select("id, name, partner_type, category, description, logo_url, cover_url, phone, email, website_url, province, address, rating, verified, status")
      .eq("status", "active")
      .eq("verified", true)
      .order("name", { ascending: true }),
    supabase
      .from("partner_services")
      .select("id, partner_id, name, service_type, description, price_from, price_to, duration_minutes, active")
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("bs_nhi")
      .select("id, full_name, specialty, hospital, experience_years, bio, avatar_url, rating, consult_count, is_online, response_hours, verified")
      .eq("verified", true)
      .order("full_name", { ascending: true }),
  ]);

  const servicesByPartner = new Map<string, PublicPartnerService[]>();

  for (const service of (serviceRows as PublicPartnerService[] | null) ?? []) {
    const current = servicesByPartner.get(service.partner_id) ?? [];
    current.push(service);
    servicesByPartner.set(service.partner_id, current);
  }

  const partners = ((partnerRows as Omit<PublicPartner, "services">[] | null) ?? []).map((partner) => ({
    ...partner,
    services: servicesByPartner.get(partner.id) ?? [],
  })) as PublicPartner[];

  return (
    <main className="flex min-h-screen flex-col bg-[#FDF8FA]">
      <SiteNav profile={profile} />
      <PartnerBrowser
        partners={partners}
        doctors={(doctorRows as PublicDoctor[] | null) ?? []}
        isAuthenticated={profile != null}
        initialTab={initialTab}
      />
      <SiteFooter />
    </main>
  );
}
