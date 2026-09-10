import { ArticleEditor } from "@/components/admin/articles/ArticleEditor";
import { requireAdminPageProfile } from "@/lib/auth/require-admin-page";

export default async function NewArticlePage() {
  const profile = await requireAdminPageProfile("/admin/articles/new");

  return <ArticleEditor mode="create" profile={profile} />;
}
