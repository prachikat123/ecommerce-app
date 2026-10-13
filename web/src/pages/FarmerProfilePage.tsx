import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSellerProfile } from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeletons";
import { EmptyState, ErrorState } from "../components/States";
import { cn } from "../lib/cn";
import { formatCount } from "../lib/format";

const PRACTICES = [
  { icon: "water_drop", label: "Drip Irrigation", tone: "text-primary" },
  { icon: "compost", label: "Zero Residue", tone: "text-secondary" },
  { icon: "ac_unit", label: "Cold-Storage Ready", tone: "text-tertiary" },
  { icon: "assignment_turned_in", label: "Soil Health Card (Grade A)", tone: "text-primary" }
] as const;

/** Full / half / empty star name for a 0–5 rating. */
function starName(index: number, rating: number): string {
  if (rating >= index + 1) return "star";
  if (rating >= index + 0.5) return "star_half";
  return "star_border";
}

export default function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const seller = useSellerProfile(id);
  const [category, setCategory] = useState("all");
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);

  if (seller.isLoading) {
    return (
      <AppShellLayout>
        <div className="max-w-4xl mx-auto w-full">
          <div className="skeleton h-48 sm:h-56 rounded-none" />
          <div className="px-margin -mt-12 flex flex-col gap-space-lg">
            <div className="skeleton h-48 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </AppShellLayout>
    );
  }

  if (seller.isError || !seller.data) {
    return (
      <AppShellLayout>
        <div className="max-w-4xl mx-auto w-full px-margin md:px-margin-desktop py-space-lg">
          <ErrorState
            title="Store not found"
            description={seller.error?.message ?? "This agri-dealer store front is unavailable."}
            onAction={() => seller.refetch()}
          />
        </div>
      </AppShellLayout>
    );
  }

  const s = seller.data;
  const location = [s.village, s.district, s.state].filter(Boolean).join(", ");
  const region = [s.district, s.state].filter(Boolean).join(", ") || "India";
  const memberYear = new Date(s.memberSince).getFullYear();
  const firstName = s.ownerName.split(" ")[0] || s.ownerName;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || s.shopName)}`;

  /* Category buckets derived from the full seller catalog. */
  const catMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of s.products) {
    const slug = p.category?.slug ?? "other";
    const name = p.category?.name ?? "Other Inputs";
    const entry = catMap.get(slug);
    if (entry) entry.count += 1;
    else catMap.set(slug, { slug, name, count: 1 });
  }
  const categories = Array.from(catMap.values());
  const activeCategory = category === "all" || catMap.has(category) ? category : "all";
  const filtered =
    activeCategory === "all"
      ? s.products
      : s.products.filter((p) => (p.category?.slug ?? "other") === activeCategory);

  const handleShare = () => {
    const url = window.location.href;
    const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
    if (nav.share) {
      void nav.share({ title: `${s.shopName} — KrishiBazaar`, url }).catch(() => undefined);
    } else {
      void navigator.clipboard?.writeText(url).catch(() => undefined);
    }
  };

  const reviews = [
    {
      initials: "TS",
      name: "Tukaram B. Shinde",
      meta: "Lasalgaon, Niphad • Verified Buyer",
      ago: "2 days ago",
      avatar: "bg-primary-container text-on-primary-container",
      text: "Excellent seed purity and packaging. The hybrid seeds gave 94% germination in our nursery bed. Fast village van delivery directly to the Gram Panchayat."
    },
    {
      initials: "SM",
      name: "Sunita Devidas More",
      meta: "Dindori Valley FPO • Verified Buyer",
      ago: "1 week ago",
      avatar: "bg-tertiary-container text-on-tertiary-container",
      text: `${firstName}'s vermicompost and fresh onion batches are top-notch. Honest pricing and direct farm gate transparency. We have ordered 25 bags collectively for our Self Help Group.`
    },
    {
      initials: "GK",
      name: "Ganesh Pandurang Kadam",
      meta: "Yeola Cluster • Verified Buyer",
      ago: "2 weeks ago",
      avatar: "bg-secondary-container text-on-secondary-container",
      text: "Very knowledgeable progressive seller. Ordered 10 packs of seeds; dispatch was prompt within 24 hours. Excellent harvest yields guaranteed."
    }
  ];

  return (
    <AppShellLayout>
      <div className="max-w-4xl mx-auto w-full pb-6">
        {/* ───────── Farm cover & identity overlap card ───────── */}
        <div className="relative w-full">
          <div className="relative w-full h-48 sm:h-56 bg-surface-container overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary" />
            <div className="absolute -right-8 -top-10 opacity-[0.15] text-on-primary">
              <Icon name="storefront" filled className="text-[190px]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Top floating chips */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm text-primary font-label-md text-label-md">
                <Icon name="verified" filled className="text-[16px] text-primary" />
                AgriStack ID: {s.id.slice(0, 8).toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Share profile"
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform"
                >
                  <Icon name="share" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label={saved ? "Remove bookmark" : "Bookmark farmer"}
                  aria-pressed={saved}
                  onClick={() => setSaved((v) => !v)}
                  className="w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform"
                >
                  <Icon name={saved ? "favorite" : "favorite_border"} filled={saved} className={cn("text-[18px]", saved && "text-error")} />
                </button>
              </div>
            </div>

            {/* Harvest season pill */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white font-label-sm text-label-sm">
              <Icon name="eco" className="text-[14px] text-secondary-fixed" />
              <span>Harvest Season: Kharif &amp; Rabi Active</span>
            </div>
          </div>

          {/* Farmer identity overlap card */}
          <div className="relative px-margin -mt-12">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
              <div className="flex items-end justify-between -mt-16">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full p-1 bg-surface-container-lowest shadow-lg">
                    <div className="w-full h-full rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                      <Icon name="agriculture" filled className="text-[42px]" />
                    </div>
                  </div>
                  {s.verified && (
                    <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md">
                      <Icon name="verified" filled className="text-[18px]" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setFollowing((v) => !v)}
                    className={cn(
                      "h-10 px-4 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all",
                      following ? "bg-surface-container-highest text-on-surface" : "bg-primary-container text-on-primary-container"
                    )}
                  >
                    <Icon name={following ? "check" : "person_add"} className="text-[18px]" />
                    {following ? "Following" : "Follow"}
                  </button>
                  <a
                    href="#support"
                    className="h-10 px-3.5 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md font-semibold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Icon name="call" className="text-[18px]" />
                    Farm-Gate
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">{s.shopName}</h1>
                  {s.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                      <Icon name="shield" filled className="text-[13px]" />
                      ICAR Certified
                    </span>
                  )}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                  {s.ownerName} • Progressive Kisan &amp; Agri-Input Producer
                </p>
              </div>

              {/* Meta details mosaic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs pt-1">
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Icon name="location_on" className="text-[18px] text-tertiary mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">{location || region}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{region}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Icon name="landscape" className="text-[18px] text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-body-sm text-body-sm text-on-surface font-medium">{formatCount(s.productCount)} Active Listings</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Seeds, nutrients &amp; farm produce</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Icon name="verified_user" className="text-[18px] text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-body-sm text-body-sm text-on-surface font-medium">Verified Agri Stack Seller</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Trusted by village &amp; FPO buyers</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Icon name="groups" className="text-[18px] text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-body-sm text-body-sm text-on-surface font-medium">Member Since {memberYear}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{region} Agri Cluster</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── Quick farm metric stats ribbon ───────── */}
        <section className="px-margin mt-space-lg">
          <div className="bg-surface-container-low rounded-xl p-space-md grid grid-cols-2 gap-space-sm sm:grid-cols-4">
            <div className="bg-surface-container-lowest rounded-lg p-space-sm flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Overall Rating</span>
                <Icon name="star" filled className="text-[16px] text-tertiary" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-price-hero text-price-hero text-on-surface font-bold tabular">{s.rating.toFixed(1)}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">/ 5.0</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Store Rating</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-space-sm flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Catalog</span>
                <Icon name="inventory_2" className="text-[16px] text-primary" filled />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-price-hero text-price-hero text-primary font-bold tabular">{formatCount(s.productCount)}</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Items Available</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-space-sm flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Region</span>
                <Icon name="workspace_premium" className="text-[16px] text-secondary" />
              </div>
              <div className="mt-2">
                <p className="font-title-md text-title-md text-on-surface font-bold leading-tight truncate">{s.district ?? s.state ?? "India"}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Agri Cluster</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-space-sm flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Sourcing Trust</span>
                <Icon name="verified" filled className="text-[16px] text-primary" />
              </div>
              <div className="mt-2">
                <p className="font-title-md text-title-md text-primary font-bold leading-tight">100% Purity</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">ICAR &amp; NPOP Certified</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Direct mandi rate benchmark bar ───────── */}
        <section className="px-margin mt-space-md">
          <div className="bg-primary-container text-on-primary-container rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-lowest/20 flex items-center justify-center shrink-0">
                <Icon name="trending_down" className="text-[22px]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-title-md text-title-md font-bold">Direct Farm Gate Savings</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">18-24% OFF</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-primary-container/90">Mandi comparative rate updated today</p>
              </div>
            </div>
            <Icon name="arrow_forward" className="text-[20px] text-on-primary-container shrink-0" />
          </div>
        </section>

        {/* ───────── About the farmer ───────── */}
        <section className="px-margin mt-space-xl">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="psychology_alt" className="text-primary text-[22px]" />
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">About the Farmer</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                Verified Seller
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Namaste! I am {s.ownerName}, running {s.shopName} from {location || region}. We specialise in high-yield hybrid
              seeds, bio-certified nutrients and fresh farm produce, sourced directly from our farm gate to your village hub.
              We practice drip fertigation, zero-chemical natural pest management and guarantee transparent harvest batch
              traceability on every order.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-bold">Verified Farming Practices</span>
              <div className="flex flex-wrap gap-2">
                {PRACTICES.map((p) => (
                  <span key={p.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface font-label-md text-label-md">
                    <Icon name={p.icon} className={cn("text-[15px]", p.tone)} />
                    {p.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Trust micro-banner */}
            <div className="rounded-lg bg-surface-container-high/60 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="format_image_left" filled className="text-primary text-[20px]" />
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Quality tested under Maharashtra Krishi Vikas Cell</span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold shrink-0">Audit PDF</span>
            </div>
          </div>
        </section>

        {/* ───────── Products by this seller ───────── */}
        <section className="px-margin mt-space-xl">
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-2">
              <Icon name="storefront" className="text-primary text-[22px]" />
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Products by {s.ownerName}</h2>
            </div>
            <span className="font-label-md text-label-md text-primary font-semibold">{formatCount(s.productCount)} Items Available</span>
          </div>

          {s.products.length === 0 ? (
            <EmptyState
              icon="inventory_2"
              title="No products listed yet"
              description="This seller hasn't published any agri-inputs."
            />
          ) : (
            <>
              {/* Category filter chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-space-sm pt-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-colors",
                    activeCategory === "all" ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  All ({formatCount(s.products.length)})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategory(c.slug)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors",
                      activeCategory === c.slug ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    {c.name} ({formatCount(c.count)})
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon="category"
                  title="Nothing in this category"
                  description="Try another category to see this seller's listings."
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}

              <Link
                to="/products"
                className="w-full mt-space-md py-3 rounded-lg bg-surface-container-low text-primary font-title-md text-title-md font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                View All {formatCount(s.productCount)} Farm Gate Listings
                <Icon name="arrow_forward" className="text-[20px]" />
              </Link>
            </>
          )}
        </section>

        {/* ───────── Ratings & reviews ───────── */}
        <section className="px-margin mt-space-xl">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="rate_review" filled className="text-tertiary text-[22px]" />
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Farmer Ratings &amp; Reviews</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-bold">{s.verified ? "Verified Store" : "New Store"}</span>
            </div>

            {/* Rating breakdown scorecard */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row gap-space-md items-center">
              <div className="flex flex-col items-center justify-center sm:pr-space-md">
                <span className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-bold tabular">{s.rating.toFixed(1)}</span>
                <div className="flex items-center text-tertiary my-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Icon key={i} name={starName(i, s.rating)} filled className="text-[18px]" />
                  ))}
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant text-center">{region} Agri Cluster</span>
              </div>

              <div className="flex-1 w-full flex flex-col gap-1.5">
                {[
                  { label: "5 ★", pct: 88, tone: "bg-primary" },
                  { label: "4 ★", pct: 9, tone: "bg-primary-fixed-dim" },
                  { label: "3 ★", pct: 3, tone: "bg-tertiary-fixed-dim" }
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant w-6">{row.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div className={cn("h-full rounded-full", row.tone)} style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant w-8 text-right font-medium">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badge */}
            <div className="p-2.5 rounded-lg bg-surface-container text-on-surface flex items-center gap-2">
              <Icon name="verified" filled className="text-primary text-[18px]" />
              <span className="font-label-sm text-label-sm text-on-surface font-medium">100% Verified Farmer &amp; Buyer Reviews via KrishiBazaar Mandi Network</span>
            </div>

            {/* Individual review cards */}
            <div className="flex flex-col gap-space-md pt-1">
              {reviews.map((r) => (
                <div key={r.name} className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-title-md font-bold text-[13px] shrink-0", r.avatar)}>
                        {r.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-title-md text-title-md text-on-surface font-semibold leading-tight truncate">{r.name}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{r.meta}</p>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline shrink-0">{r.ago}</span>
                  </div>
                  <div className="flex items-center text-tertiary gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Icon key={i} name="star" filled className="text-[15px]" />
                    ))}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button type="button" className="flex-1 h-11 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform">
                <Icon name="edit" className="text-[18px]" />
                Write a Review
              </button>
              <button type="button" className="flex-1 h-11 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform">
                Load More
              </button>
            </div>
          </div>
        </section>

        {/* ───────── Farm location & pick-up point ───────── */}
        <section className="px-margin mt-space-xl">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="pin_drop" className="text-primary text-[22px]" />
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Farm Location &amp; Pick-up Point</h2>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold">Open 7 AM - 6 PM</span>
            </div>

            <div
              className="w-full h-40 rounded-lg bg-surface-container overflow-hidden relative shadow-inner"
              style={{ backgroundImage: "linear-gradient(135deg, #dae2fd 0%, #eaedff 55%, #f2f3ff 100%)" }}
            >
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(0,101,44,0.08) 15px, rgba(0,101,44,0.08) 16px), repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,101,44,0.08) 15px, rgba(0,101,44,0.08) 16px)"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg">
                  <Icon name="location_on" filled className="text-[24px]" />
                </span>
              </div>
              <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 shadow">
                <Icon name="navigation" className="text-primary text-[18px]" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Near {s.district ?? region} APMC Hub</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-on-surface-variant min-w-0">
                <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{s.shopName} Farm Gate Hub</p>
                <p className="font-label-sm text-label-sm text-outline truncate">{location || region}</p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold flex items-center gap-1 shrink-0"
              >
                <Icon name="directions" className="text-[16px]" />
                Route
              </a>
            </div>
          </div>
        </section>

        {/* ───────── Farm-gate helpline & support bar ───────── */}
        <div id="support" className="px-margin mt-space-xl">
          <div className="bg-surface-container-high rounded-xl p-space-md flex items-center justify-between gap-space-sm shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <Icon name="support_agent" className="text-[20px]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-title-md text-title-md text-on-surface font-bold truncate">Have Sourcing Questions?</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Connect directly with {s.shopName} via WhatsApp</p>
              </div>
            </div>
            <a
              href="https://wa.me/919800042200"
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform shadow"
            >
              <Icon name="chat" className="text-[18px]" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </AppShellLayout>
  );
}
