import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getUserProfile } from "@/lib/auth/profile";
import { getCloudinary } from "@/lib/cloudinary";
import { cleanupArticleDraftMedia, isArticleDraftToken } from "@/lib/media/article";
import { destroyMediaAsset } from "@/lib/media/cleanup";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Danh mục owner_table mà user thường (không phải admin) được tự gắn media vào
// — chỉ khi thật sự sở hữu dòng đó (kiểm tra qua verifyOwnership bên dưới).
// Các owner_table khác (products, partners, bs_nhi, articles...) sẽ mở dần khi
// triển khai các UC tương ứng — hiện chỉ admin mới dùng được cho các bảng đó.
const SELF_SERVE_OWNER_TABLES = new Set(["users", "c2c_listings"]);

async function verifyOwnership(
  supabase: SupabaseClient,
  table: string,
  ownerId: string,
  userId: string,
): Promise<boolean> {
  if (table === "users") return ownerId === userId;

  if (table === "c2c_listings") {
    const { data } = await supabase
      .from("c2c_listings")
      .select("id")
      .eq("id", ownerId)
      .eq("seller_id", userId)
      .maybeSingle();

    return data != null;
  }

  return false;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file để upload." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ ảnh JPEG, PNG, WEBP hoặc GIF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Ảnh vượt quá 5MB." }, { status: 400 });
  }

  const ownerTable = formData.get("owner_table");
  const ownerId = formData.get("owner_id");
  const assetType = formData.get("asset_type");
  const altText = formData.get("alt_text");
  const draftTokenValue = formData.get("draft_token");

  const resolvedOwnerTable = typeof ownerTable === "string" && ownerTable ? ownerTable : null;
  let resolvedOwnerId = typeof ownerId === "string" && ownerId ? ownerId : null;
  const draftToken = draftTokenValue === null ? null : typeof draftTokenValue === "string" ? draftTokenValue : null;

  if (draftTokenValue !== null && !isArticleDraftToken(draftToken)) {
    return NextResponse.json({ error: "draft_token khong hop le." }, { status: 400 });
  }

  const resolvedAssetType = typeof assetType === "string" && assetType ? assetType : "image";

  if (draftToken) {
    if (!user) {
      return NextResponse.json({ error: "Can dang nhap de upload anh bai viet." }, { status: 401 });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Chi Admin moi duoc upload anh bai viet." }, { status: 403 });
    }

    if (resolvedOwnerTable || resolvedOwnerId || !["cover", "article_inline"].includes(resolvedAssetType)) {
      return NextResponse.json({ error: "Thong tin upload anh bai viet khong hop le." }, { status: 400 });
    }
  }

  if (draftToken) {
    resolvedOwnerId = null;
  } else if (resolvedOwnerTable) {
    // Gắn media vào 1 dòng đã tồn tại (vd thêm ảnh cho sản phẩm/listing đã
    // tạo) luôn cần xác định được "ai đang làm việc này" để kiểm tra quyền sở
    // hữu — khách vãng lai (chưa đăng nhập) không đi qua nhánh này.
    if (!user) {
      return NextResponse.json({ error: "Cần đăng nhập để gắn media vào dữ liệu đã có." }, { status: 401 });
    }

    const profile = await getUserProfile(supabase, user.id);
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      if (!SELF_SERVE_OWNER_TABLES.has(resolvedOwnerTable)) {
        return NextResponse.json(
          { error: `Không có quyền gắn media vào bảng "${resolvedOwnerTable}".` },
          { status: 403 },
        );
      }

      if (!resolvedOwnerId || !(await verifyOwnership(supabase, resolvedOwnerTable, resolvedOwnerId, user.id))) {
        return NextResponse.json(
          { error: "Chỉ được gắn media vào dữ liệu của chính mình." },
          { status: 403 },
        );
      }
    }
  } else {
    // Không có owner_table nghĩa là ảnh được upload TRƯỚC khi tạo dòng dữ
    // liệu (vd UC-10 - Gửi Form Pass Đồ C2C: khách chưa đăng nhập chọn ảnh
    // trước, có URL rồi mới POST /api/listings kèm URL đó) — cho phép cả
    // khách vãng lai, không cần kiểm tra sở hữu vì chưa có gì để sở hữu.
    resolvedOwnerId = null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  let uploadResult;

  try {
    const cloudinary = getCloudinary();

    uploadResult = await cloudinary.uploader.upload(base64, {
      folder: `suaembe/${resolvedOwnerTable ?? (draftToken ? "articles" : "misc")}`,
      resource_type: "image",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload Cloudinary thất bại.";

    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      uploader_id: user?.id ?? null,
      owner_table: resolvedOwnerTable,
      owner_id: resolvedOwnerId,
      asset_type: resolvedAssetType,
      provider: "cloudinary",
      public_id: uploadResult.public_id,
      url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      mime_type: file.type,
      size_bytes: uploadResult.bytes,
      width: uploadResult.width ?? null,
      height: uploadResult.height ?? null,
      alt_text: typeof altText === "string" && altText ? altText : null,
      metadata: draftToken ? { draft_token: draftToken } : {},
    })
    .select()
    .single();

  if (error) {
    try {
      await getCloudinary().uploader.destroy(uploadResult.public_id, { resource_type: "image" });
    } catch (cleanupError) {
      console.error("[uploads] Khong the don resource Cloudinary sau khi luu media that bai:", cleanupError);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ asset: data }, { status: 201 });
}

// Xoá 1 ảnh đã upload lên Cloudinary/media_assets nhưng CHƯA gắn vào dữ liệu
// nào (owner_table/owner_id đều null) — đúng trường hợp nút "✕" trong form
// đăng tin C2C (UC-10): khách/mẹ bỉm upload ảnh trước khi tạo tin, có thể gỡ
// lại trước khi submit. Ràng buộc owner null + asset_type + mới upload
// trong 6 giờ là biên an toàn thật ở tầng query (không chỉ kiểm tra ở app)
// — chặn endpoint bị lợi dụng xoá media đã gắn vào dữ liệu thật của người
// khác dù có đoán/lấy được URL, vì URL đoán được cũng chỉ xoá nổi ảnh nháp
// chưa ai dùng tới.
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: { secure_url?: unknown; draft_token?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  if (body.draft_token !== undefined) {
    if (!isArticleDraftToken(body.draft_token)) {
      return NextResponse.json({ error: "draft_token khong hop le." }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "Can dang nhap de xoa anh bai viet nhap." }, { status: 401 });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Chi Admin moi duoc xoa anh bai viet nhap." }, { status: 403 });
    }

    await cleanupArticleDraftMedia(body.draft_token, user.id);

    return NextResponse.json({ ok: true });
  }

  const secureUrl = typeof body.secure_url === "string" ? body.secure_url : null;

  if (!secureUrl) {
    return NextResponse.json({ error: "Thiếu secure_url." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data: asset } = await admin
    .from("media_assets")
    .select("id, public_id, uploader_id")
    .eq("secure_url", secureUrl)
    .eq("asset_type", "listing_image")
    .is("owner_table", null)
    .is("owner_id", null)
    .gte("created_at", sixHoursAgo)
    .maybeSingle();

  if (!asset) {
    return NextResponse.json(
      { error: "Không tìm thấy ảnh hoặc ảnh đã được gắn vào dữ liệu khác." },
      { status: 404 },
    );
  }

  // Ảnh do người đã đăng nhập upload thì chỉ chính họ mới gỡ được; ảnh của
  // khách vãng lai (uploader_id null) chấp nhận cho gỡ theo đúng URL vì đây
  // chỉ là ảnh nháp chưa gắn vào tin nào, rủi ro thấp.
  if (asset.uploader_id && asset.uploader_id !== user?.id) {
    return NextResponse.json({ error: "Không có quyền xoá ảnh này." }, { status: 403 });
  }

  await destroyMediaAsset(asset);

  return NextResponse.json({ ok: true });
}
