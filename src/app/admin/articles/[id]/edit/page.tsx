import { ArticleEditor } from "@/components/admin/articles/ArticleEditor";
import { requireAdminPageProfile } from "@/lib/auth/require-admin-page";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAdminPageProfile(`/admin/articles/${id}/edit`);

  return <ArticleEditor mode="edit" articleId={id} profile={profile} />;
}
