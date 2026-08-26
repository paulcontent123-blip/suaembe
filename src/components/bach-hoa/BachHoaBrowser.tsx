"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ProductDetailModal } from "@/components/bach-hoa/ProductDetailModal";
import type { Brand, Product, ProductCategory } from "@/lib/catalog/types";
import { formatVnd } from "@/lib/format";

// product_categories không có cột icon riêng trong schema — suy ra icon theo
// từ khoá trong tên danh mục (chỉ để trang trí, tên danh mục vẫn là dữ liệu
// thật 100%, không bịa thêm danh mục/icon nào ngoài DB).
const CATEGORY_ICON_RULES: [RegExp, string][] = [
  [/sữa/i, "🥛"],
  [/bầu|thai/i, "🤰"],
  [/ăn dặm|dinh dưỡng/i, "🍽"],
  [/bỉm|tã/i, "👶"],
  [/bình sữa|núm|hút sữa/i, "🍼"],
  [/sơ sinh/i, "🎁"],
  [/thời trang|quần áo|yếm/i, "👕"],
  [/vitamin|sức khoẻ|sức khỏe/i, "💊"],
  [/giặt|tắm|vệ sinh/i, "🧴"],
  [/đồ chơi|học tập/i, "🧸"],
  [/xe đẩy|địu/i, "🛒"],
];

function categoryIcon(name: string): string {
  return CATEGORY_ICON_RULES.find(([re]) => re.test(name))?.[1] ?? "🏷";
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const thumb = product.image_urls?.[0];

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
      <div className="relative flex h-28 items-center justify-center bg-[#FFF0F5] text-4xl">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          "📦"
        )}
        {product.milk_products?.stage && (
          <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold text-white bg-[#0D9488]">
            {product.milk_products.stage}
          </span>
        )}
      </div>
      <div className="p-2.5">
        {product.brands?.name && (
          <div className="mb-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#94A3B8]">
            {product.brands.name}
          </div>
        )}
        <div className="mb-1.5 line-clamp-2 text-xs font-semibold leading-snug text-[#0F172A]">
          {product.name}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-sm font-extrabold text-[#E8547A]">
            {formatVnd(product.price_vnd)}
          </span>
          {product.original_price_vnd != null &&
            product.price_vnd != null &&
            product.original_price_vnd > product.price_vnd && (
              <span className="font-mono text-[10px] text-[#94A3B8] line-through">
                {formatVnd(product.original_price_vnd)}
              </span>
            )}
        </div>
        {product.milk_products?.rating != null && (
          <div className="mt-0.5 text-[10.5px] text-[#D97706]">
            ⭐ {product.milk_products.rating.toFixed(1)} ({product.milk_products.review_count})
          </div>
        )}
      </div>
    </div>
  );
}

export function BachHoaBrowser({
  categories,
  brands,
}: {
  categories: ProductCategory[];
  brands: Brand[];
}) {
  // product_categories tự tham chiếu chính nó (parent_id) nên cây danh mục
  // không giới hạn số cấp — gom theo parent_id 1 lần để tra cứu con trực
  // tiếp (cấp 2) lẫn cháu (cấp 3) từ cùng 1 cấu trúc, thay vì viết riêng
  // logic lọc cho từng cấp.
  const categoriesByParent = useMemo(() => {
    const map = new Map<string | null, ProductCategory[]>();

    for (const c of categories) {
      const arr = map.get(c.parent_id) ?? [];
      arr.push(c);
      map.set(c.parent_id, arr);
    }

    return map;
  }, [categories]);

  const childrenOf = (id: string | null) => categoriesByParent.get(id) ?? [];

  function descendantIds(id: string): string[] {
    const result: string[] = [];
    const stack = [id];

    while (stack.length > 0) {
      const current = stack.pop() as string;

      for (const child of childrenOf(current)) {
        result.push(child.id);
        stack.push(child.id);
      }
    }

    return result;
  }

  const topCategories = childrenOf(null);

  const [selectedTopId, setSelectedTopId] = useState<string | null>(topCategories[0]?.id ?? null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedGrandchildId, setSelectedGrandchildId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const productGridRef = useRef<HTMLDivElement>(null);

  // Danh sách sản phẩm "gốc" theo top category, KHÔNG bị ảnh hưởng bởi
  // search/brand filter — chỉ dùng để dựng khu điều hướng nhanh (subcat-grid)
  // bên dưới, để bấm vào 1 mục lọc kết quả không làm khu điều hướng co lại.
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);

  const childCategories = selectedTopId ? childrenOf(selectedTopId) : [];

  // Nhóm sản phẩm theo danh mục con — dùng để render khu "tìm nhanh theo
  // nhãn hàng/sản phẩm" (subcat-grid) giống demo, nhưng bằng đúng tên sản
  // phẩm thật trong DB thay vì danh sách text bịa sẵn.
  const productsByChild = useMemo(() => {
    const map = new Map<string, Product[]>();

    for (const p of browseProducts) {
      if (!p.category_id) continue;

      const arr = map.get(p.category_id) ?? [];
      arr.push(p);
      map.set(p.category_id, arr);
    }

    return map;
  }, [browseProducts]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      if (!selectedTopId) {
        setBrowseProducts([]);

        return;
      }

      const categoryIds = [selectedTopId, ...descendantIds(selectedTopId)];
      const params = new URLSearchParams({ category_id: categoryIds.join(",") });

      try {
        const res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (res.ok) setBrowseProducts(data.products ?? []);
      } catch {
        // im lặng — khu điều hướng chỉ là tiện ích thêm, không chặn trang chính
      }
    }

    run();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopId]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);

    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const categoryIds = selectedGrandchildId
        ? [selectedGrandchildId]
        : selectedChildId
          ? [selectedChildId, ...descendantIds(selectedChildId)]
          : selectedTopId
            ? [selectedTopId, ...descendantIds(selectedTopId)]
            : [];

      if (categoryIds.length > 0) params.set("category_id", categoryIds.join(","));
      if (selectedBrandId) params.set("brand_id", selectedBrandId);
      if (debouncedSearch) params.set("q", debouncedSearch);

      try {
        const res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được sản phẩm.");

          return;
        }

        setProducts(data.products ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopId, selectedChildId, selectedGrandchildId, selectedBrandId, debouncedSearch]);

  // Popup xanh nhỏ tự tắt sau 2.5s — dùng chung cho mọi thao tác lọc/tìm
  // kiếm trên trang, giống kiểu thông báo trong demo suaembe.html.
  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function selectTop(id: string) {
    setSelectedTopId(id);
    setSelectedChildId(null);
    setSelectedGrandchildId(null);

    const cat = topCategories.find((c) => c.id === id);
    if (cat) showToast(`Đang xem danh mục: ${cat.name}`);
  }

  function selectChild(id: string) {
    const willDeselect = selectedChildId === id && !selectedGrandchildId;

    setSelectedChildId(willDeselect ? null : id);
    setSelectedGrandchildId(null);

    if (willDeselect) {
      showToast("Đã bỏ lọc, hiển thị tất cả");
    } else {
      const cat = childCategories.find((c) => c.id === id);
      if (cat) showToast(`Đang lọc: ${cat.name}`);
    }
  }

  function selectGrandchild(childId: string, grandchildId: string) {
    const willDeselect = selectedGrandchildId === grandchildId;

    setSelectedChildId(childId);
    setSelectedGrandchildId(willDeselect ? null : grandchildId);

    if (!willDeselect) {
      const grand = childrenOf(childId).find((g) => g.id === grandchildId);
      if (grand) showToast(`Đang lọc: ${grand.name}`);
    }
  }

  function selectBrand(id: string | null, label: string) {
    setSelectedBrandId(id);
    showToast(id ? `Đang lọc theo nhãn hàng: ${label}` : "Đã bỏ lọc, hiển thị tất cả nhãn hàng");
  }

  function handleQuickFilter(product: Product) {
    setSearch(product.name);
    setDebouncedSearch(product.name);
    showToast(`Đang lọc: ${product.name}`);
    productGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearch() {
    const q = search.trim();

    setDebouncedSearch(q);
    if (q) showToast(`Đang tìm: ${q}`);
  }

  const selectedTop = topCategories.find((c) => c.id === selectedTopId) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-7 py-3.5">
        <div className="font-serif text-lg font-black text-white">
          🛍 Bách Hóa <em className="not-italic">Mẹ &amp; Bé</em>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="🔍 Tìm sản phẩm, nhãn hàng..."
            className="w-72 rounded-lg border-none bg-white px-4 py-2 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-lg border border-white/40 bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30"
          >
            Tìm
          </button>
        </div>
      </div>

      {topCategories.length === 0 ? (
        <div className="flex-1 p-10 text-center text-sm text-[#64748B]">
          Chưa có danh mục sản phẩm nào. Vui lòng quay lại sau.
        </div>
      ) : (
        // flex (thay vì grid không có chiều cao) để 3 cột luôn cao bằng
        // nhau và lấp hết phần còn lại của trang, tránh khoảng trắng/xám
        // lệch nhau khi danh sách sản phẩm ngắn hơn viewport.
        <div className="flex flex-1">
          <div className="w-[220px] shrink-0 border-r border-black/10 bg-white py-3">
            <div className="px-4 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
              Danh mục sản phẩm
            </div>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectTop(cat.id)}
                className={`flex w-full items-center gap-2.5 border-l-2 px-4 py-2 text-left text-[13px] transition ${selectedTopId === cat.id
                    ? "border-[#E8547A] bg-[#E8547A]/10 font-bold text-[#E8547A]"
                    : "border-transparent text-[#64748B] hover:bg-[#E8547A]/5 hover:text-[#E8547A]"
                  }`}
              >
                <span className="w-4 text-center">{categoryIcon(cat.name)}</span>
                {cat.name}
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1 bg-[#F1F5F9] p-5">
            {selectedTop && (
              <div className="mb-3.5 flex items-center gap-2">
                <span className="text-lg">{categoryIcon(selectedTop.name)}</span>
                <span className="text-base font-extrabold text-[#0F172A]">{selectedTop.name}</span>
              </div>
            )}

            {/* Bố cục khu danh mục con giống suaembe.html: mỗi danh mục con (cấp
                2) là 1 khối tiêu đề trong lưới 2 cột, luôn hiện đủ tiêu đề (kể
                cả chưa có sản phẩm nào — như một mục lục). Bên dưới tiêu đề:
                nếu danh mục con này có danh mục cháu (cấp 3) thật trong DB thì
                liệt kê tên các cấp 3 đó (bấm để lọc đúng cấp 3); nếu không có
                cấp 3 nào thì lùi về cách cũ — liệt kê tên sản phẩm thật làm
                bộ lọc nhanh. Bấm tiêu đề cấp 2 để lọc theo cả cấp 2 lẫn mọi
                cấp 3 bên trong nó, bấm lại (hoặc "Xem tất cả") để bỏ lọc. */}
            {childCategories.length > 0 && (
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  {/* <span className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Danh mục con
                  </span> */}
                  {(selectedChildId || selectedGrandchildId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChildId(null);
                        setSelectedGrandchildId(null);
                      }}
                      className="text-xs font-semibold text-[#E8547A] hover:underline"
                    >
                      Xem tất cả ✕
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {childCategories.map((c) => {
                    const grandchildren = childrenOf(c.id);
                    const items = productsByChild.get(c.id) ?? [];
                    const isSelected = selectedChildId === c.id;

                    return (
                      <div key={c.id}>
                        <button
                          type="button"
                          onClick={() => selectChild(c.id)}
                          className={`mb-1.5 block w-full border-b pb-1.5 text-left text-[13.5px] font-bold transition ${isSelected
                              ? "border-[#E8547A] text-[#E8547A]"
                              : "border-black/10 text-[#0F172A] hover:text-[#E8547A]"
                            }`}
                        >
                          {c.name}
                        </button>
                        {grandchildren.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {grandchildren.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => selectGrandchild(c.id, g.id)}
                                className={`border-l-2 py-1 pl-2.5 text-left text-[13px] transition ${selectedGrandchildId === g.id
                                    ? "border-[#E8547A] font-bold text-[#E8547A]"
                                    : "border-transparent text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A]"
                                  }`}
                              >
                                {g.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          items.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {items.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleQuickFilter(p)}
                                  className={`border-l-2 py-1 pl-2.5 text-left text-[13px] transition ${search === p.name
                                      ? "border-[#E8547A] font-bold text-[#E8547A]"
                                      : "border-transparent text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A]"
                                    }`}
                                >
                                  {p.brands?.name ? `${p.name} (${p.brands.name})` : p.name}
                                </button>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={productGridRef} className="mb-2.5 flex items-center justify-between text-xs font-bold text-[#64748B]">
              <span>Sản phẩm nổi bật{loading ? " — đang tải..." : ""}</span>
              <span className="font-normal text-[#94A3B8]">Hiển thị {products.length} sản phẩm</span>
            </div>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            {!loading && products.length === 0 && !error ? (
              <p className="py-10 text-center text-sm text-[#94A3B8]">
                Chưa có sản phẩm phù hợp trong danh mục này.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2.5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
                ))}
              </div>
            )}
          </div>

          <div className="w-[200px] shrink-0 border-l border-black/10 bg-white p-3.5">
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
              Nhãn hàng
            </div>
            {brands.length === 0 ? (
              <p className="text-xs text-[#94A3B8]">Chưa có nhãn hàng.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => selectBrand(null, "Tất cả")}
                  className={`rounded-lg border px-2.5 py-2 text-center text-xs font-bold transition ${!selectedBrandId
                      ? "border-[#E8547A] bg-[#E8547A]/10 text-[#E8547A]"
                      : "border-black/10 text-[#0F172A] hover:border-[#E8547A]"
                    }`}
                >
                  Tất cả nhãn hàng
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectBrand(b.id, b.name)}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-bold transition ${selectedBrandId === b.id
                        ? "border-[#E8547A] bg-[#E8547A]/10 text-[#E8547A]"
                        : "border-black/10 text-[#0F172A] hover:border-[#E8547A]"
                      }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-7 right-7 z-[300] flex items-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          ✅ {toast}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
