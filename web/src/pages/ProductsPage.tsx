import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategories, useProducts } from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeletons";
import { EmptyState, ErrorState } from "../components/States";
import { useToast } from "../store/ToastContext";
import { formatINR } from "../lib/format";
import { cn } from "../lib/cn";
import type { ProductQueryParams } from "../api/types";

const SORTS: Array<{ id: string; label: string }> = [
  { id: "popular", label: "Popularity" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Top Rated" },
  { id: "newest", label: "Newest First" }
];

const PAGE_SIZE = 12;

const BUDGETS: Array<{ label: string; min?: string; max?: string }> = [
  { label: "Under ₹500", max: "500" },
  { label: "₹500 - ₹2,000", min: "500", max: "2000" },
  { label: "₹2,000 - ₹5,000", min: "2000", max: "5000" }
];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const { toast } = useToast();

  const [searchText, setSearchText] = useState(params.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const category = params.get("category") ?? "";
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "popular";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const minRating = params.get("minRating") ?? "";
  const isFlashDeal = params.get("isFlashDeal") === "true";
  const page = Number(params.get("page") ?? "1");

  useEffect(() => {
    setSearchText(params.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const query = useMemo<ProductQueryParams>(
    () => ({
      category: category || undefined,
      q: q || undefined,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      isFlashDeal: isFlashDeal || undefined,
      page,
      limit: PAGE_SIZE
    }),
    [category, q, sort, minPrice, maxPrice, minRating, isFlashDeal, page]
  );

  const products = useProducts(query);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  }

  function resetAll() {
    setParams(new URLSearchParams(), { replace: true });
    setShowFilters(false);
  }

  const activeFilterCount = [category, minPrice, maxPrice, minRating, isFlashDeal ? "1" : ""].filter(Boolean).length;
  const activeCategory = categories.data?.find((c) => c.slug === category);

  const heading = activeCategory?.name ?? (isFlashDeal ? "Flash Mandi Deals" : "All Agri-Inputs");

  const total = products.data?.total ?? 0;
  const totalPages = products.data?.totalPages ?? 1;
  const shown = total ? Math.min(total, (page - 1) * PAGE_SIZE + (products.data?.items.length ?? 0)) : 0;
  const percentLoaded = total ? Math.round((shown / total) * 100) : 0;
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages]);

  function clearPrice() {
    update({ minPrice: undefined, maxPrice: undefined });
  }

  return (
    <AppShellLayout>
      <div className="flex flex-col gap-space-md pb-space-lg">
        {/* 1 · Breadcrumbs, heading & sub-category pills */}
        <section className="bg-surface-container-low px-margin md:px-margin-desktop pt-space-md pb-space-sm">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm overflow-x-auto whitespace-nowrap py-1 no-scrollbar"
          >
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Icon name="chevron_right" className="text-[12px] text-outline" />
            <Link to="/products" className="hover:text-primary transition-colors">
              Agri Inputs
            </Link>
            <Icon name="chevron_right" className="text-[12px] text-outline" />
            <span className="text-primary font-semibold">{heading}</span>
          </nav>

          <div className="flex items-baseline justify-between gap-3 mt-space-xs">
            <div className="min-w-0">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:text-headline-md md:font-headline-md text-on-surface tracking-tight font-bold truncate">
                {heading}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                ICAR verified certified lots directly delivered to farmgate
              </p>
            </div>
            {products.data && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold shadow-sm whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {products.data.total} Products
              </span>
            )}
          </div>

          {/* Search keeps the ?q= wiring available on this page */}
          <div className="flex items-center gap-2 h-12 px-3 mt-space-sm rounded-xl bg-surface-container-lowest border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
            <Icon name="search" className="text-[20px] text-outline" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") update({ q: searchText });
              }}
              placeholder="Search seeds, fertiliser, sprayer…"
              className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
              aria-label="Search products"
            />
            {searchText && (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setSearchText("");
                  update({ q: undefined });
                }}
                className="text-outline hover:text-on-surface"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
            <Button variant="soft" size="sm" icon="search" onClick={() => update({ q: searchText })}>
              Search
            </Button>
          </div>

          {/* Quick sub-category pills horizontal scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pt-space-sm pb-1 no-scrollbar -mx-margin md:-mx-margin-desktop px-margin md:px-margin-desktop">
            <Chip active={!category && !isFlashDeal} onClick={() => update({ category: undefined, isFlashDeal: undefined })}>
              All
            </Chip>
            <Chip active={isFlashDeal} onClick={() => update({ isFlashDeal: isFlashDeal ? undefined : "true" })}>
              <Icon name="bolt" className="text-[14px]" /> Flash Deals
            </Chip>
            {categories.data?.map((c) => (
              <Chip key={c.id} active={category === c.slug} onClick={() => update({ category: c.slug })}>
                {c.name}
              </Chip>
            ))}
          </div>
        </section>

        {/* 2 · Sticky filter & sort bar */}
        <section className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md py-2.5 px-margin md:px-margin-desktop shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm font-label-md text-label-md font-semibold active:scale-95 transition-all"
            >
              <Icon name="tune" className="text-[18px] text-primary" />
              <span>Filters</span>
              <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            </button>

            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-lg p-0.5 shadow-sm overflow-x-auto max-w-[240px]">
              <Icon name="swap_vert" className="text-[16px] text-outline ml-1.5" />
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="bg-transparent font-label-md text-label-md text-on-surface py-1.5 pr-2 pl-0.5 outline-none font-semibold cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-secondary font-label-sm text-label-sm shrink-0">
              <Icon name="verified" className="text-[16px]" />
              <span>Mandi Rates</span>
            </div>
          </div>

          {/* Active filter chips tag row */}
          {(activeFilterCount > 0 || q !== "") && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar -mx-margin md:-mx-margin-desktop px-margin md:px-margin-desktop">
              {activeCategory && (
                <ActiveChip label={activeCategory.name} onRemove={() => update({ category: undefined })} />
              )}
              {isFlashDeal && <ActiveChip label="Flash Deals" onRemove={() => update({ isFlashDeal: undefined })} />}
              {(minPrice !== "" || maxPrice !== "") && (
                <ActiveChip
                  label={`${formatINR(Number(minPrice) || 0)} – ${maxPrice ? formatINR(Number(maxPrice)) : "∞"}`}
                  onRemove={clearPrice}
                />
              )}
              {minRating !== "" && (
                <ActiveChip label={`⭐ ${minRating}+ Rating`} onRemove={() => update({ minRating: undefined })} />
              )}
              {q !== "" && <ActiveChip label={`“${q}”`} onRemove={() => update({ q: undefined })} />}
              <button
                onClick={resetAll}
                className="font-label-sm text-label-sm text-tertiary font-bold underline whitespace-nowrap ml-1"
              >
                Reset
              </button>
            </div>
          )}
        </section>

        {/* Layout: mobile drawer / desktop sidebar + results */}
        <div className="flex flex-col md:flex-row gap-6 px-margin md:px-margin-desktop">
          {/* 3 · Collapsible / mobile filter drawer panel */}
          <aside className={cn("md:w-64 shrink-0", showFilters ? "block" : "hidden md:block")}>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md md:sticky md:top-32">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="filter_list" className="text-primary text-[20px]" />
                  <h2 className="font-title-md text-title-md text-on-surface font-bold">Detailed Agri Filters</h2>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error md:hidden"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>

              <FilterGroup label="Category">
                <div className="flex flex-wrap gap-1.5">
                  <FilterTag active={!category && !isFlashDeal} onClick={() => update({ category: undefined, isFlashDeal: undefined })}>
                    All
                  </FilterTag>
                  <FilterTag active={isFlashDeal} onClick={() => update({ isFlashDeal: isFlashDeal ? undefined : "true" })}>
                    Flash Deals
                  </FilterTag>
                  {categories.data?.map((c) => (
                    <FilterTag key={c.id} active={category === c.slug} onClick={() => update({ category: c.slug })}>
                      {c.name}
                    </FilterTag>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Budget Per Acre">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-label-md text-label-md font-bold text-on-surface">Budget Range</span>
                  <span className="font-label-sm text-label-sm text-primary font-bold whitespace-nowrap">
                    {minPrice || maxPrice
                      ? `${formatINR(Number(minPrice) || 0)} – ${maxPrice ? formatINR(Number(maxPrice)) : "Any"}`
                      : "₹300 - ₹4,500"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Min"
                    defaultValue={minPrice}
                    onBlur={(e) => update({ minPrice: e.target.value })}
                    className="w-full h-10 px-2 rounded-lg border border-outline-variant bg-white font-body-sm text-body-sm outline-none focus:border-primary"
                  />
                  <span className="text-outline">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Max"
                    defaultValue={maxPrice}
                    onBlur={(e) => update({ maxPrice: e.target.value })}
                    className="w-full h-10 px-2 rounded-lg border border-outline-variant bg-white font-body-sm text-body-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {BUDGETS.map((b) => (
                    <FilterTag
                      key={b.label}
                      active={minPrice === (b.min ?? "") && maxPrice === (b.max ?? "")}
                      onClick={() => update({ minPrice: b.min, maxPrice: b.max })}
                    >
                      {b.label}
                    </FilterTag>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Minimum Rating">
                <div className="flex flex-wrap gap-1.5">
                  {["4.5", "4", "3.5", "3"].map((r) => (
                    <FilterTag
                      key={r}
                      active={minRating === r}
                      onClick={() => update({ minRating: minRating === r ? undefined : r })}
                    >
                      <Icon name="star" filled className="text-[13px]" /> {r}+
                    </FilterTag>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Sort By">
                <select
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value })}
                  className="w-full h-10 px-2 rounded-lg border border-outline-variant bg-white font-body-sm text-body-sm outline-none focus:border-primary"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FilterGroup>

              <Button
                fullWidth
                variant="primary"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="md:hidden"
              >
                Apply Filters ({products.data?.total ?? 0} Results)
              </Button>
            </div>
          </aside>

          {/* 4 · Product listing grid */}
          <div className="flex-1 min-w-0">
            {products.isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-space-sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {products.isError && (
              <ErrorState
                title="Couldn’t load products"
                description={products.error.message}
                onAction={() => products.refetch()}
              />
            )}

            {products.isSuccess && products.data.items.length === 0 && (
              <EmptyState
                icon="search_off"
                title="No products match your filters"
                description="Try clearing a filter or searching for a different crop input."
                actionLabel="Clear filters"
                onAction={resetAll}
              />
            )}

            {products.isSuccess && products.data.items.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-space-sm">
                  {products.data.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* 5 · Mandi Price Guarantee bento inset */}
                <MandiGuarantee onView={() => toast("Mandi comparative chart coming soon", "info")} />

                {/* 6 · Pagination, load more & hotline help */}
                <section className="pt-space-xl flex flex-col items-center">
                  <div className="w-full max-w-xs flex flex-col items-center gap-1 mb-space-sm">
                    <div className="flex justify-between w-full font-label-sm text-label-sm text-on-surface-variant">
                      <span>
                        Showing {shown} of {total} products
                      </span>
                      <span className="font-bold text-primary">{percentLoaded}% Loaded</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percentLoaded)}%` }}
                      />
                    </div>
                  </div>

                  {products.data.hasMore && (
                    <button
                      onClick={() => update({ page: String(page + 1) })}
                      className="w-full max-w-xs py-3 px-space-md rounded-xl bg-surface-container-lowest text-primary font-label-md text-label-md font-bold shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Icon name="expand_circle_down" className="text-[20px]" />
                      <span>Load Next {PAGE_SIZE} Products</span>
                    </button>
                  )}

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 mt-space-md flex-wrap justify-center">
                      <PageButton
                        disabled={page <= 1}
                        onClick={() => update({ page: String(page - 1) })}
                        ariaLabel="Previous page"
                      >
                        <Icon name="chevron_left" className="text-[16px]" />
                      </PageButton>
                      {pages.map((p, i) =>
                        p === "ellipsis" ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-outline font-bold">
                            …
                          </span>
                        ) : (
                          <PageButton key={p} active={p === page} onClick={() => update({ page: String(p) })}>
                            {p}
                          </PageButton>
                        )
                      )}
                      <PageButton
                        disabled={page >= totalPages}
                        onClick={() => update({ page: String(page + 1) })}
                        ariaLabel="Next page"
                      >
                        <Icon name="chevron_right" className="text-[16px]" />
                      </PageButton>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-space-xl p-space-sm rounded-xl bg-surface-container-low text-on-surface-variant max-w-sm w-full">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <Icon name="support_agent" className="text-[18px]" />
                    </div>
                    <div className="text-left font-body-sm text-[11px] leading-tight">
                      <span className="font-bold text-on-surface block">Need agronomy guidance?</span>
                      Call toll-free{" "}
                      <a href="tel:18004195744" className="font-semibold text-primary">
                        1800-419-KRISHI
                      </a>{" "}
                      for free seed prescription.
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShellLayout>
  );
}

function pageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) result.push("ellipsis");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < total - 1) result.push("ellipsis");
  result.push(total);
  return result;
}

/** Sub-category pill (active = primary-container per the reference listing). */
function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md flex items-center gap-1 whitespace-nowrap transition-colors",
        active
          ? "bg-primary-container text-on-primary font-semibold shadow-sm"
          : "bg-surface-container-lowest text-on-surface-variant shadow-sm hover:bg-surface-container"
      )}
    >
      {children}
    </button>
  );
}

/** Small selectable tag used inside the filter groups. */
function FilterTag({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg font-label-sm text-label-sm font-semibold transition-colors",
        active
          ? "bg-primary-container text-on-primary"
          : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
      )}
    >
      {children}
    </button>
  );
}

/** Removable active-filter chip shown in the sticky bar. */
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm whitespace-nowrap">
      <span>{label}</span>
      <button onClick={onRemove} aria-label={`Remove ${label} filter`} className="hover:text-error">
        <Icon name="close" className="text-[14px]" />
      </button>
    </span>
  );
}

/** Filter card group: tinted surface container with an overline-ish label. */
function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface-container-low p-space-sm rounded-xl">
      <span className="font-label-md text-label-md font-bold text-on-surface block mb-2">{label}</span>
      {children}
    </div>
  );
}

/** Page-number button (active = solid primary per the reference). */
function PageButton({
  active,
  disabled,
  onClick,
  ariaLabel,
  children
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "w-9 h-9 rounded-lg font-label-md text-label-md flex items-center justify-center shadow-sm transition-colors",
        active
          ? "bg-primary text-on-primary font-bold"
          : "bg-surface-container-lowest text-on-surface font-semibold hover:bg-surface-container",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

/** APMC / Mandi price guarantee split-bento inset. */
function MandiGuarantee({ onView }: { onView: () => void }) {
  return (
    <div className="mt-space-md mb-space-sm p-space-md rounded-2xl bg-gradient-to-r from-secondary/10 via-surface-container-low to-secondary-container/20 shadow-sm relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
          <Icon name="price_check" className="text-[24px]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-title-md text-title-md text-on-surface font-bold">APMC Mandi Rate Guarantee</span>
            <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-sm text-[9px] uppercase font-bold">
              Live Rate
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
            All prices are matched daily with Lasalgaon &amp; Nashik APMC agro-centers. Save up to 18% with verified
            direct manufacturer dispatch and free replacement warranty.
          </p>
          <div className="flex items-center gap-3 mt-2 font-label-md text-label-md font-semibold text-primary">
            <button onClick={onView} className="inline-flex items-center gap-1 hover:underline">
              <span>View Mandi Comparative Chart</span>
              <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}