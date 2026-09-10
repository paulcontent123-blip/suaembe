import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminSection } from "@/components/admin/AdminFrame";
import { requireAdminPageProfile } from "@/lib/auth/require-admin-page";

const ADMIN_SECTIONS: AdminSection[] = [
  "dashboard",
  "san-pham",
  "listings",
  "bai-viet",
  "users",
  "bs-nhi",
  "consults",
  "orders",
  "doi-tac",
  "settings",
];

// Middleware đã chặn route /admin cho user không phải role 'admin', nhưng vẫn
// kiểm tra lại ở đây (defense in depth) phòng trường hợp middleware bị bypass/lỗi.
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const profile = await requireAdminPageProfile("/admin");
  const requestedSection = (await searchParams).section;
  const section = Array.isArray(requestedSection) ? requestedSection[0] : requestedSection;
  const initialSection = ADMIN_SECTIONS.includes(section as AdminSection)
    ? (section as AdminSection)
    : "dashboard";

  return <AdminShell profile={profile} initialSection={initialSection} />;
}
