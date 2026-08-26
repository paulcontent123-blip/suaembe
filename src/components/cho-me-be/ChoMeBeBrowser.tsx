"use client";

import { useEffect, useRef, useState } from "react";

import { ListingDetailModal, type ListingDetailData } from "@/components/cho-me-be/ListingDetailModal";
import { SellListingForm } from "@/components/cho-me-be/SellListingForm";
import type { Listing } from "@/lib/catalog/types";
import { formatVnd } from "@/lib/format";

function toListingDetail(listing: Listing): ListingDetailData {
  return {
    ...listing,
    sellerName: listing.seller?.full_name ?? null,
    sellerVerified: listing.seller?.is_verified ?? false,
  };
}

function quantityLabel(listing: Listing): { text: string; cls: string } | null {
  if (listing.status !== "approved") return null;

  return listing.quantity_available > 0
    ? { text: `Còn ${listing.quantity_available}`, cls: "bg-[#0D9488]/90 text-white" }
    : { text: "Hết hàng", cls: "bg-black/60 text-white" };
}

// Khớp đúng CATEGORY_OPTIONS trong SellListingForm.tsx (UC-10) — value lọc là
// nhãn đầy đủ (khớp dữ liệu thật lưu trong c2c_listings.category), short chỉ
// để hiển thị pill/badge cho gọn giống demo (suaembe.html cũng dùng nhãn rút
// gọn "Sữa dư", "Quần áo"... dù dữ liệu đầy đủ hơn).
const CATEGORIES: { icon: string; short: string; value: string }[] = [
  { icon: "🥛", short: "Sữa dư", value: "Sữa dư / Sữa mẹ" },
  { icon: "👕", short: "Quần áo", value: "Quần áo trẻ em" },
  { icon: "🛒", short: "Xe đẩy/Địu", value: "Xe đẩy / Địu / Ghế ô tô" },
  { icon: "🧸", short: "Đồ chơi", value: "Đồ chơi & Phụ kiện" },
  { icon: "🍼", short: "Bình sữa", value: "Bình sữa / Núm ti / Máy hút sữa" },
  { icon: "🏠", short: "Đồ dùng", value: "Đồ dùng phòng bé" },
];

// Rút gọn category thật (free text) thành nhãn ngắn cho badge trên card,
// giống cách demo hiển thị "Sữa dư"/"Quần áo"/"Xe đẩy" thay vì tên đầy đủ.
function shortCategoryLabel(category: string): string {
  const bySlash = category.split("/")[0].trim();
  if (bySlash !== category) return bySlash;

  const byAmp = category.split("&")[0].trim();
  if (byAmp !== category) return byAmp;

  return category.trim().split(/\s+/).slice(0, 2).join(" ");
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));

  if (hours < 1) return "Vừa đăng";
  if (hours < 24) return `${hours}h trước`;

  return `${Math.floor(hours / 24)} ngày trước`;
}

function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const thumb = listing.images?.[0];
  const quantity = quantityLabel(listing);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className="cursor-pointer overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#E8547A] hover:shadow-lg"
    >
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-[#F1F5F9] text-4xl">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          "🛍"
        )}
        {listing.category && (
          <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
            {shortCategoryLabel(listing.category)}
          </span>
        )}
        {quantity && (
          <span className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold ${quantity.cls}`}>
            {quantity.text}
          </span>
        )}
        {listing.status !== "approved" && (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-[#D97706] px-1.5 py-0.5 text-[9.5px] font-bold text-white">
            {listing.status === "pending" ? "Chờ duyệt" : listing.status === "sold" ? "Đã bán" : "Đã ẩn"}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <div className="mb-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-[#0F172A]">
          {listing.title}
        </div>
        <div className="mb-1.5 text-[11px] text-[#64748B]">
          📍 {listing.province ?? "Chưa rõ khu vực"} · {timeAgo(listing.created_at)}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-[15px] font-extrabold text-[#E8547A]">
            {formatVnd(listing.price)}
          </span>
          {listing.original_price != null && listing.original_price > listing.price && (
            <span className="font-mono text-[11px] text-[#94A3B8] line-through">
              {formatVnd(listing.original_price)}
            </span>
          )}
        </div>
        {listing.seller && (
          <div className="mt-1 text-[11px] font-semibold text-[#0D9488]">
            {listing.seller.is_verified ? (
              <>✓ {listing.seller.full_name ?? "Người bán"} · Đã xác minh</>
            ) : (
              <span className="text-[#94A3B8]">{listing.seller.full_name ?? "Người bán ẩn danh"}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 24;

export function ChoMeBeBrowser({
  defaultName = "",
  defaultPhone = "",
  isAuthenticated = false,
}: {
  defaultName?: string;
  defaultPhone?: string;
  isAuthenticated?: boolean;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [province, setProvince] = useState("");
  const [debouncedProvince, setDebouncedProvince] = useState("");
  const [myListingsOnly, setMyListingsOnly] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellFormOpen, setSellFormOpen] = useState(false);
  const sellFormRef = useRef<HTMLDivElement>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Popup xanh nhỏ tự tắt sau 2.5s — dùng chung cho cả 3 thao tác: lọc danh
  // mục, tìm kiếm khu vực, đăng tin (giống kiểu thông báo trong demo
  // suaembe.html).
  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function handleSelectCategory(value: string | null, label: string) {
    setCategory(value);
    showToast(value ? `Đang lọc: ${label}` : "Đã bỏ lọc, hiển thị tất cả danh mục");
  }

  // Form đăng bán giờ nằm dưới lưới tin đăng (giống suaembe.html) — cuộn
  // mượt tới form khi mở, để người dùng không phải tự kéo xuống tìm.
  useEffect(() => {
    if (sellFormOpen) {
      sellFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sellFormOpen]);

  // Debounce ô tìm khu vực — vừa tránh gọi API mỗi phím gõ, vừa tránh spam
  // popup thông báo liên tục; toast tìm kiếm chỉ hiện khi người dùng gõ xong.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedProvince(province.trim()), 350);

    return () => window.clearTimeout(t);
  }, [province]);

  useEffect(() => {
    if (debouncedProvince) showToast(`Đang tìm khu vực: ${debouncedProvince}`);
  }, [debouncedProvince]);

  // Chế độ "Tin của tôi" (UC-28) dùng /api/listings/me — trả về TOÀN BỘ tin
  // của chính mình (mọi status), không phân trang (số tin của 1 mẹ bỉm nhỏ,
  // không cần "Xem thêm"). Lọc category/tỉnh áp dụng luôn ở client cho gọn,
  // không cần route riêng nhận query params.
  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      if (myListingsOnly) {
        try {
          const res = await fetch("/api/listings/me", { signal: controller.signal });
          const data = await res.json();

          if (!res.ok) {
            setError(data.error ?? "Không tải được tin của tôi.");

            return;
          }

          let page = (data.listings ?? []) as Listing[];
          if (category) page = page.filter((l) => l.category === category);
          if (debouncedProvince) {
            page = page.filter((l) => l.province?.toLowerCase().includes(debouncedProvince.toLowerCase()));
          }

          setListings(page);
          setHasMore(false);
        } catch (err) {
          if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
          setLoading(false);
        }

        return;
      }

      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (category) params.set("category", category);
      if (debouncedProvince) params.set("province", debouncedProvince);

      try {
        const res = await fetch(`/api/listings?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được tin đăng.");

          return;
        }

        const page = data.listings ?? [];
        setListings(page);
        setHasMore(page.length === PAGE_SIZE);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
  }, [category, debouncedProvince, myListingsOnly]);

  // "Xem thêm" — tải thêm trang thật (dựa trên số tin đang có làm offset),
  // không phải số cố định như "2.400+" trong demo.
  async function handleLoadMore() {
    setLoadingMore(true);
    setError(null);

    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(listings.length) });
    if (category) params.set("category", category);
    if (debouncedProvince) params.set("province", debouncedProvince);

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được tin đăng.");

        return;
      }

      const page = data.listings ?? [];
      setListings((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-7 py-10">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
        <span className="h-px w-5 bg-[#E8547A]" /> Pass đồ C2C · Không cần tài khoản
      </div>
      <h1 className="mb-3 font-serif text-3xl font-black text-[#0F172A]">
        Chợ <em className="not-italic text-[#E8547A]">Mẹ Bỉm</em> — Đa ngành hàng
      </h1>
      <p className="mb-6 max-w-xl text-sm leading-relaxed text-[#64748B]">
        Mua bán/pass đồ mẹ bỉm: sữa dư, quần áo, xe đẩy, đồ chơi... Gửi form pass đồ không cần đăng
        nhập — SữaEmbe kiểm tra và đăng tin giúp bạn. Đặt mua thanh toán thường, SữaEmbe liên hệ
        xác nhận trước khi giao.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSelectCategory(null, "Tất cả")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${!category
                ? "border-[#E8547A]/30 bg-[#E8547A]/10 text-[#E8547A]"
                : "border-black/10 bg-white text-[#64748B] hover:border-[#E8547A]"
              }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleSelectCategory(c.value, c.short)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${category === c.value
                  ? "border-[#E8547A]/30 bg-[#E8547A]/10 text-[#E8547A]"
                  : "border-black/10 bg-white text-[#64748B] hover:border-[#E8547A]"
                }`}
            >
              {c.icon} {c.short}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMyListingsOnly((v) => !v)}
              className={`rounded-lg border px-3.5 py-2.5 text-[13px] font-bold transition ${myListingsOnly
                  ? "border-[#E8547A] bg-[#E8547A]/10 text-[#E8547A]"
                  : "border-black/10 bg-white text-[#64748B] hover:border-[#E8547A]"
                }`}
            >
              📋 Tin của tôi
            </button>
          )}
          <button
            type="button"
            onClick={() => setSellFormOpen((v) => !v)}
            className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2.5 text-[13px] font-bold text-white"
          >
            + Đăng tin / Trao đổi đồ
          </button>
        </div>
      </div>

      <input
        value={province}
        onChange={(e) => setProvince(e.target.value)}
        placeholder="Lọc theo tỉnh/thành (VD: TP. Hồ Chí Minh)..."
        className="mb-5 w-full max-w-xs rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#E8547A] sm:max-w-sm"
      />

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!loading && listings.length === 0 && !error ? (
        <p className="py-14 text-center text-sm text-[#94A3B8]">
          Chưa có tin đăng nào phù hợp với bộ lọc hiện tại.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} onClick={() => setSelectedListing(l)} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg border border-[#E8547A]/30 bg-[#E8547A]/10 px-7 py-2.5 text-[13.5px] font-bold text-[#E8547A] disabled:opacity-60"
              >
                {loadingMore ? "Đang tải..." : "Xem thêm tin đăng →"}
              </button>
            </div>
          )}
        </>
      )}

      {sellFormOpen && (
        <div ref={sellFormRef}>
          <SellListingForm
            defaultSellerName={defaultName}
            defaultPhone={defaultPhone}
            onClose={() => setSellFormOpen(false)}
            onCreated={(listing) => {
              // Khách vãng lai không có auth.uid() để RLS cho đọc lại chính
              // tin vừa gửi (đang ở trạng thái pending) nên API trả về
              // listing.id = null trong trường hợp này — không đưa vào lưới
              // đang xem vì refresh lại trang họ cũng sẽ không thấy được nó.
              if (listing.id) setListings((prev) => [listing, ...prev]);
              showToast("Đã gửi thông tin! Tin đang chờ admin duyệt.");
            }}
          />
        </div>
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={toListingDetail(selectedListing)}
          onClose={() => setSelectedListing(null)}
          allowPurchase={!myListingsOnly}
          defaultBuyerName={defaultName}
          defaultBuyerPhone={defaultPhone}
          canEdit={myListingsOnly}
          onSaved={(updated) => {
            setListings((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
            showToast("Đã lưu thay đổi tin đăng.");
          }}
          onDeleted={() => {
            setListings((prev) => prev.filter((l) => l.id !== selectedListing.id));
            setSelectedListing(null);
            showToast("Đã xoá tin đăng.");
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-7 right-7 z-[300] flex items-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}
