import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAddToCart, useProduct, useRelatedProducts } from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { PriceCluster } from "../components/PriceCluster";
import { MandiBar } from "../components/MandiBar";
import { DiscountBadge } from "../components/Badges";
import { QuantityStepper } from "../components/QuantityStepper";
import { FavoriteButton, ProductCard } from "../components/ProductCard";
import { ErrorState } from "../components/States";
import { useToast } from "../store/ToastContext";
import { formatINR, formatCount } from "../lib/format";
import { cn } from "../lib/cn";

const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "specs", label: "Specifications" },
  { id: "agronomy", label: "Sowing Guide" },
  { id: "benefits", label: "Farmer Profit" }
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]["id"];

const FAQS = [
  {
    q: "How is my order delivered to my village?",
    a: "We dispatch from the nearest Nashik hub and deliver to 19,000+ pincodes, usually within 48 hours. Cash on Delivery (COD) and Kisan Credit Card (KCC) are accepted at your farm gate."
  },
  {
    q: "Are the products genuine and certified?",
    a: "Yes. Every item is sourced directly from licensed manufacturers and FPOs, backed by our 100% genuine guarantee and a 7-day free replacement policy."
  },
  {
    q: "What if I receive a damaged or incorrect item?",
    a: "Raise a replacement request within 7 days of delivery and we will arrange a free doorstep replacement — no questions asked."
  }
];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const product = useProduct(slug);
  const related = useRelatedProducts(slug);
  const addToCart = useAddToCart();

  const [pack, setPack] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const p = product.data;
  const gallery = useMemo(() => (p ? [p.image, ...(p.gallery ?? [])].slice(0, 4) : []), [p]);

  if (product.isLoading) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-6 w-2/3 rounded mt-4" />
          <div className="skeleton h-6 w-1/3 rounded mt-2" />
          <div className="skeleton h-12 w-full rounded-xl mt-6" />
        </div>
      </AppShellLayout>
    );
  }

  if (product.isError || !p) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg">
          <ErrorState
            title="Product not found"
            description={product.error?.message ?? "This product may have been removed."}
            onAction={() => navigate("/products")}
          />
        </div>
      </AppShellLayout>
    );
  }

  const packOptions = p.packSizes.length > 0 ? p.packSizes : [p.unit];
  const selectedPack = pack ?? packOptions[0];
  const seller = p.seller;
  const savings = Math.max(0, p.mrp - p.price);

  const add = () => {
    addToCart.mutate(
      { productId: p.id, quantity, unit: selectedPack },
      {
        onSuccess: () => toast(`${quantity} × ${p.name} added to cart`, "success"),
        onError: (err) => toast(err.message, "error")
      }
    );
  };

  const buyNow = () => {
    addToCart.mutate(
      { productId: p.id, quantity, unit: selectedPack },
      {
        onSuccess: () => navigate("/checkout"),
        onError: (err) => toast(err.message, "error")
      }
    );
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      void navigator.share({ title: p.name, url }).catch(() => {});
    } else {
      void navigator.clipboard?.writeText(url);
      toast("Link ready to share", "info");
    }
  };

  // Illustrative rating histogram derived from the average rating.
  const five = Math.round((p.rating / 5) * 100);
  const rest = 100 - five;
  const four = Math.round(rest * 0.6);
  const three = Math.round(rest * 0.25);
  const dist = [
    { stars: 5, percent: five, color: "bg-primary" },
    { stars: 4, percent: four, color: "bg-secondary" },
    { stars: 3, percent: three, color: "bg-tertiary-container" },
    { stars: 2, percent: Math.max(0, rest - four - three), color: "bg-outline" }
  ];

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-lg pb-24 md:pb-0 flex flex-col gap-space-lg">
        {/* Micro breadcrumbs banner */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap bg-surface-container-low text-on-surface-variant text-[11px] font-label-md px-space-md py-2 rounded-xl">
          <Link to="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" className="text-[12px]" />
          <Link to="/products" className="hover:text-primary">Seeds</Link>
          {p.category && (
            <>
              <Icon name="chevron_right" className="text-[12px]" />
              <Link to={`/products?category=${p.category.slug}`} className="hover:text-primary truncate max-w-[140px]">
                {p.category.name}
              </Link>
            </>
          )}
          <Icon name="chevron_right" className="text-[12px]" />
          <span className="text-on-surface font-semibold truncate max-w-[140px]">{p.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-space-lg items-start">
          {/* ───────── Gallery card ───────── */}
          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm">
                  <Icon name="verified" filled className="text-[13px]" />
                  Govt Approved
                </span>
                {(p.certification ?? p.badge) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm">
                    {p.certification ?? p.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Share"
                  onClick={share}
                  className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:text-primary active:scale-95 transition-transform"
                >
                  <Icon name="share" className="text-[18px]" />
                </button>
                <FavoriteButton productId={p.id} />
              </div>
            </div>

            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
              <img
                src={gallery[activeImage]}
                alt={p.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute top-2 left-2">
                <DiscountBadge percent={p.discountPercent} />
              </div>
              <div className="absolute bottom-2 left-2 bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-label-md">
                <Icon name="360" className="text-[14px]" />
                <span>Tap to Zoom / 360°</span>
              </div>
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={cn(
                      "h-16 rounded-lg overflow-hidden bg-surface-container-low p-0.5 transition-opacity",
                      activeImage === i ? "opacity-100" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ───────── Buy box ───────── */}
          <div className="flex flex-col gap-space-lg">
            {/* Title & brand card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-sm uppercase tracking-wider truncate">
                  {p.brand}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-label-md text-secondary shrink-0">
                  <Icon name="workspace_premium" className="text-[14px]" />
                  {p.certification ?? "Quality Assured"}
                </span>
              </div>

              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{p.name}</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{p.description}</p>

              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-md">
                  <span className="font-bold">{p.rating.toFixed(1)}</span>
                  <Icon name="star" filled className="text-[13px]" />
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                  {formatCount(p.ratingCount)} Verified Farmer Ratings
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className={cn("font-body-sm text-body-sm font-semibold", p.inStock ? "text-secondary" : "text-error")}>
                  {p.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="pt-2">
                <PriceCluster price={p.price} mrp={p.mrp} discountPercent={p.discountPercent} size="hero" />
                <p className="text-[12px] font-body-sm text-on-surface-variant mt-0.5">
                  Save {formatINR(savings)} today. Inclusive of all agricultural taxes &amp; GST.
                </p>
                {p.mandiPrice !== undefined && p.mandiSavings !== undefined && (
                  <div className="mt-2.5">
                    <MandiBar mandiPrice={p.mandiPrice} price={p.price} savings={p.mandiSavings} />
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full", p.inStock ? "bg-secondary" : "bg-error")} />
                  <span className={cn("font-label-md text-label-md font-semibold", p.inStock ? "text-secondary" : "text-error")}>
                    {p.inStock ? "In Stock • Ready for dispatch" : "Out of stock"}
                  </span>
                </div>
                {p.inStock && p.stock <= 20 && (
                  <span className="font-label-sm text-tertiary-container font-semibold">Only {p.stock} left at Nashik</span>
                )}
              </div>
            </div>

            {/* Variant selector + quantity card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-title-md text-title-md text-on-surface">Select Pack Size</span>
                <span className="font-label-sm text-on-surface-variant truncate">Unit: {p.unit}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {packOptions.map((size) => {
                  const active = selectedPack === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPack(size)}
                      className={cn(
                        "p-2.5 rounded-lg text-left shadow-sm transition-colors",
                        active
                          ? "bg-surface-container-low text-primary"
                          : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-label-md text-on-surface font-bold truncate">{size}</span>
                        <Icon
                          name={active ? "check_circle" : "radio_button_unchecked"}
                          className={cn("text-[18px] shrink-0", active ? "text-primary" : "text-outline")}
                        />
                      </div>
                      <div className={cn("font-title-lg font-bold mt-1", active ? "text-primary" : "text-on-surface")}>
                        {formatINR(p.price)}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">{active ? "Selected" : "Tap to select"}</div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <div>
                  <span className="font-label-md text-on-surface block">Quantity (Packets)</span>
                  <span className="font-label-sm text-secondary">Buy 5+ for 5% farm cashback</span>
                </div>
                <QuantityStepper
                  value={quantity}
                  max={Math.max(1, p.stock)}
                  disabled={!p.inStock}
                  onChange={setQuantity}
                />
              </div>
            </div>

            {/* Desktop conversion CTAs */}
            <div className="hidden md:flex gap-2">
              <Button
                size="lg"
                fullWidth
                icon="shopping_cart"
                loading={addToCart.isPending}
                disabled={!p.inStock}
                onClick={add}
              >
                Add to Cart
              </Button>
              <Button
                size="lg"
                fullWidth
                variant="accent"
                icon="bolt"
                disabled={!p.inStock}
                onClick={buyNow}
              >
                Buy Now
              </Button>
            </div>

            {/* Pincode & delivery card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon name="local_shipping" className="text-primary text-[20px]" />
                  <span className="font-title-md text-title-md text-on-surface">Pincode &amp; Delivery</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast("Delivery address is managed from your profile", "info")}
                  className="font-label-sm text-primary font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon name="pin_drop" className="text-tertiary-container text-[18px] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-label-md text-on-surface font-bold truncate">Deliver to: Nashik, 422003</div>
                    <div className="text-[11px] text-on-surface-variant truncate">Dindori Road, Adgaon Rural Hub</div>
                  </div>
                </div>
                <Icon name="check_circle" className="text-secondary text-[20px] shrink-0" />
              </div>

              <div className="space-y-2 pt-1">
                {[
                  { icon: "bolt", tone: "text-secondary", title: "FREE Village Delivery in 48 hrs", sub: "Order today for same-day warehouse dispatch" },
                  { icon: "verified_user", tone: "text-primary", title: "7-Day Free Replacement Guarantee", sub: "Guaranteed genuine inputs from licensed manufacturers" },
                  { icon: "payments", tone: "text-primary", title: "Cash on Delivery (COD) & KCC Accepted", sub: "Pay at farm gate or swipe Kisan Credit Card on delivery" }
                ].map((h) => (
                  <div key={h.title} className="flex items-start gap-2.5">
                    <Icon name={h.icon} className={cn("text-[18px] mt-0.5", h.tone)} />
                    <div>
                      <div className="font-label-md text-on-surface font-semibold">{h.title}</div>
                      <div className="text-[11px] text-on-surface-variant">{h.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ───────── Verified seller & quality card ───────── */}
        {seller && (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <Icon name="agriculture" className="text-[20px]" />
                </div>
                <div className="min-w-0">
                  <div className="font-label-md text-on-surface font-bold flex items-center gap-1 truncate">
                    {seller.shopName}
                    {seller.verified && <Icon name="verified" filled className="text-primary text-[14px]" />}
                  </div>
                  <div className="text-[11px] text-on-surface-variant truncate">
                    {seller.district ? `${seller.district}, Maharashtra` : "Verified Agri-Dealer"}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-label-md text-primary font-bold">{p.rating.toFixed(1)} ★</div>
                <div className="text-[10px] text-on-surface-variant">{formatCount(p.ratingCount)}+ Rated</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-surface-container-low space-y-0.5">
                <div className="text-on-surface-variant font-label-sm">Certification</div>
                <div className="font-bold text-on-surface truncate">{p.certification ?? "Quality Assured"}</div>
              </div>
              <div className="p-2 rounded bg-surface-container-low space-y-0.5">
                <div className="text-on-surface-variant font-label-sm">Seller Type</div>
                <div className="font-bold text-secondary">{seller.verified ? "Verified Seller" : "Agri-Dealer"}</div>
              </div>
            </div>

            <Button variant="secondary" size="sm" icon="storefront" onClick={() => navigate(`/farmers/${seller.id}`)}>
              Visit Store
            </Button>
          </div>
        )}

        {/* ───────── Crop Doctor helpline banner ───────── */}
        <div className="bg-primary text-on-primary rounded-xl p-space-lg shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-label-sm uppercase tracking-wide opacity-90">
              <Icon name="support_agent" className="text-[16px]" />
              <span>Free Agronomist Advice</span>
            </div>
            <div className="font-title-md font-bold text-white">Confused about sowing date?</div>
            <p className="text-[12px] opacity-90 leading-tight">
              Talk to a KrishiBazaar Agri Doctor for soil, climate &amp; dosage advice.
            </p>
          </div>
          <a
            href="tel:18002669999"
            className="shrink-0 px-3 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md font-bold text-center active:scale-95 shadow-sm"
          >
            Call Doctor
          </a>
        </div>

        {/* ───────── Deep information tabs ───────── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center border-b border-surface-container overflow-x-auto no-scrollbar whitespace-nowrap bg-surface-container-low px-2 py-1.5 gap-1.5">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md font-label-md text-[12px] transition-colors",
                  tab === t.id
                    ? "bg-primary text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant font-medium hover:bg-surface-container"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-space-lg space-y-4">
            {tab === "overview" && (
              <div className="space-y-3">
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                  {p.longDesc ?? p.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2">
                    <Icon name="category" className="text-primary text-[20px]" />
                    <div className="min-w-0">
                      <div className="text-on-surface-variant font-label-sm">Category</div>
                      <div className="font-bold text-on-surface truncate">{p.category?.name ?? "Agri-Input"}</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2">
                    <Icon name="inventory_2" className="text-secondary text-[20px]" />
                    <div className="min-w-0">
                      <div className="text-on-surface-variant font-label-sm">Pack Size</div>
                      <div className="font-bold text-on-surface truncate">{selectedPack}</div>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low text-[12px] space-y-1">
                  <span className="font-bold text-on-surface flex items-center gap-1">
                    <Icon name="shield" className="text-tertiary-container text-[16px]" />
                    Genuine Agri-Input Guarantee
                  </span>
                  <p className="text-on-surface-variant">
                    Every batch is sourced directly from licensed manufacturers and FPOs, carrying a 100% authenticity guarantee.
                  </p>
                </div>
              </div>
            )}

            {tab === "specs" && (
              <div className="divide-y divide-surface-container text-[12px]">
                {[
                  { k: "Brand", v: p.brand },
                  { k: "Category", v: p.category?.name ?? "—" },
                  { k: "Unit", v: p.unit },
                  { k: "Pack Sizes", v: packOptions.join(", ") },
                  { k: "Rating", v: `${p.rating.toFixed(1)} / 5 (${formatCount(p.ratingCount)} ratings)` },
                  { k: "Availability", v: p.inStock ? `In stock (${p.stock})` : "Out of stock" },
                  { k: "Certification", v: p.certification ?? "Quality Assured" }
                ].map((row) => (
                  <div key={row.k} className="py-2 flex justify-between gap-3">
                    <span className="text-on-surface-variant shrink-0">{row.k}</span>
                    <span className="font-semibold text-on-surface text-right">{row.v}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "agronomy" && (
              <div className="space-y-2.5">
                {[
                  { n: "1", title: "Read the label & dosage", body: "Follow the recommended application rate printed on the pack for your crop and acreage." },
                  { n: "2", title: "Prepare & apply", body: "Apply during cooler hours with adequate soil moisture; use protective gear for chemical inputs." },
                  { n: "3", title: "Store safely", body: "Keep sealed in a cool, dry place away from direct sunlight, children and livestock." }
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <div className="font-label-md text-on-surface font-bold">{s.title}</div>
                      <div className="text-[12px] text-on-surface-variant">{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "benefits" && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <div className="font-label-md text-secondary font-bold flex items-center gap-1.5">
                    <Icon name="trending_up" className="text-[18px]" />
                    Better yield per acre
                  </div>
                  <p className="text-[12px] text-on-surface-variant">
                    Certified inputs from top agri brands help maximise healthy yield and reduce mid-season crop loss.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <div className="font-label-md text-tertiary font-bold flex items-center gap-1.5">
                    <Icon name="currency_rupee" className="text-[18px]" />
                    Farm-gate pricing
                  </div>
                  <p className="text-[12px] text-on-surface-variant">
                    Buy direct from FPOs and licensed dealers to save versus your local mandi rate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ───────── Farmer reviews & trust ratings ───────── */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-title-lg text-title-lg text-on-surface font-bold">Farmer Reviews</div>
              <div className="text-[12px] text-on-surface-variant">Based on {formatCount(p.ratingCount)} verified ratings</div>
            </div>
            <button
              type="button"
              onClick={() => toast("You can rate this product after your first order", "info")}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-md font-bold active:scale-95 whitespace-nowrap"
            >
              Rate Variety
            </button>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low">
            <div className="text-center shrink-0">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">{p.rating.toFixed(1)}</div>
              <div className="flex items-center justify-center text-primary text-[14px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Icon key={i} name={i < Math.round(p.rating) ? "star" : "star_border"} filled={i < Math.round(p.rating)} />
                ))}
              </div>
              <div className="text-[10px] text-on-surface-variant mt-0.5">Verified Rating</div>
            </div>
            <div className="flex-1 space-y-1 text-[10px] min-w-0">
              {dist.map((row) => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="w-4 text-on-surface-variant shrink-0">{row.stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.percent}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium shrink-0">{row.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───────── FAQ accordion ───────── */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-3">
          <div className="font-title-lg text-title-lg text-on-surface font-bold">Frequently Asked Questions</div>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-lg bg-surface-container-low overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-3 text-left flex items-center justify-between gap-2 font-label-md text-on-surface"
                >
                  <span>{f.q}</span>
                  <Icon name="expand_more" className={cn("text-[18px] transition-transform shrink-0", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && <div className="px-3 pb-3 text-[12px] text-on-surface-variant">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ───────── Frequently bought together ───────── */}
        {related.data && related.data.length > 0 && (
          <section className="flex flex-col gap-space-xs">
            <h2 className="font-title-lg text-title-lg font-bold">Frequently Bought Together</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
              {related.data.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ───────── Sticky bottom conversion bar (mobile) ───────── */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-surface/95 backdrop-blur-md px-gutter py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center gap-3 md:hidden">
        <div className="shrink-0 max-w-[38%]">
          <div className="flex items-baseline gap-1">
            <span className="font-price-card text-price-card text-primary tabular">{formatINR(p.price)}</span>
            {p.mrp > p.price && (
              <span className="font-body-sm text-[11px] text-outline line-through tabular">{formatINR(p.mrp)}</span>
            )}
          </div>
          <div className="text-[10px] text-secondary font-bold truncate">{selectedPack} • Free Delivery</div>
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Button
            size="lg"
            variant="secondary"
            icon="shopping_cart"
            className="flex-1"
            loading={addToCart.isPending}
            disabled={!p.inStock}
            onClick={add}
          >
            Add
          </Button>
          <Button
            size="lg"
            icon="arrow_forward"
            className="flex-[1.4]"
            disabled={!p.inStock}
            onClick={buyNow}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </AppShellLayout>
  );
}
