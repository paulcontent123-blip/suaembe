import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";
import { PartnerMarquee } from "@/components/home/PartnerMarquee";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string; redirect?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <SiteNav
        profile={profile}
        autoOpenLogin={params.login === "1"}
        redirectAfterLogin={params.redirect}
      />
      <Hero />
      <PartnerMarquee />
      <FeatureGrid />
      <SiteFooter />
    </main>
  );
}
