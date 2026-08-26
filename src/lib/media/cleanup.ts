import { getCloudinary } from "@/lib/cloudinary";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface DestroyableAsset {
  id: string;
  public_id: string | null;
}

// Gọi Cloudinary destroy(public_id) cho từng asset rồi xoá row media_assets
// tương ứng. Dùng admin client (service role) vì ảnh khách vãng lai upload
// có uploader_id = null, RLS delete (auth.uid() = uploader_id) không bao
// giờ khớp null = null nên không tự xoá được qua client thường. Không throw
// khi Cloudinary lỗi — caller vẫn phải hoàn tất việc chính dù dọn rác thất
// bại, chỉ log lại để theo dõi.
async function destroyMediaAssets(assets: DestroyableAsset[]): Promise<void> {
  if (assets.length === 0) return;

  const cloudinary = getCloudinary();

  await Promise.all(
    assets.map(async (asset) => {
      if (!asset.public_id) return;

      try {
        await cloudinary.uploader.destroy(asset.public_id, { resource_type: "image" });
      } catch (error) {
        console.error(`[media] Xoá Cloudinary thất bại cho public_id=${asset.public_id}:`, error);
      }
    }),
  );

  const admin = createSupabaseAdminClient();

  await admin
    .from("media_assets")
    .delete()
    .in(
      "id",
      assets.map((a) => a.id),
    );
}

// Dọn media_assets + file Cloudinary khi 1 field ảnh (avatar_url, cover_url,
// image_urls...) bị thay thế hoặc gỡ bớt khỏi 1 mảng — so URL cũ vs URL mới
// còn giữ lại, xoá đúng những asset không còn được tham chiếu ở đâu nữa.
// Khớp theo secure_url (giá trị duy nhất mọi luồng frontend đang lưu vào
// field của bảng chủ) thay vì owner_table/owner_id vì ảnh tin C2C hiện chưa
// gắn owner_id (upload trước khi tạo tin) — secure_url của Cloudinary gần
// như luôn duy nhất theo từng lần upload nên vẫn khớp đúng asset cần xoá.
export async function cleanupRemovedMediaUrls(
  oldUrls: (string | null | undefined)[],
  newUrls: (string | null | undefined)[],
): Promise<void> {
  const kept = new Set(newUrls.filter((u): u is string => !!u));
  const removed = [...new Set(oldUrls.filter((u): u is string => !!u && !kept.has(u)))];

  if (removed.length === 0) return;

  const admin = createSupabaseAdminClient();
  const { data: assets } = await admin.from("media_assets").select("id, public_id").in("secure_url", removed);

  if (!assets || assets.length === 0) return;

  await destroyMediaAssets(assets);
}

// Xoá 1 media asset cụ thể đã tra được (id + public_id) — dùng cho trường
// hợp caller đã tự truy vấn/kiểm tra quyền trước đó (vd DELETE /api/uploads
// cho ảnh chưa gắn owner nào), khác với cleanupRemovedMediaUrls vốn tự tra
// theo URL.
export async function destroyMediaAsset(asset: DestroyableAsset): Promise<void> {
  await destroyMediaAssets([asset]);
}
