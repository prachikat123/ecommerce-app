import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCategories, useProducts } from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeletons";
import { ErrorState } from "../components/States";
import { useToast } from "../store/ToastContext";
import { formatINR } from "../lib/format";
import { cn } from "../lib/cn";
import type { ProductQueryParams } from "../api/types";

/* ── Live flash-deal countdown (mirrors the design micro-interaction) ── */
function useCountdown(startSeconds: number) {
  const [seconds, setSeconds] = useState(startSeconds);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}h : ${m}m : ${s}s`;
}

const FEATURED_TABS: Array<{ id: string; label: string; params: ProductQueryParams }> = [
  { id: "best", label: "Best Sellers", params: { isBestSeller: true, limit: 8 } },
  { id: "new", label: "New Arrivals", params: { isNewArrival: true, limit: 8 } },
  { id: "crop", label: "Crop Protection", params: { category: "pesticides", limit: 8 } },
  { id: "micro", label: "Micro-Nutrients", params: { category: "fertilizers", limit: 8 } }
];

/* Rotating tile tones from the reference categories grid (Seeds → Animal Feed). */
const CATEGORY_TONES = [
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-fixed text-on-tertiary-fixed",
  "bg-surface-container-high text-on-surface",
  "bg-surface-container-highest text-primary",
  "bg-surface-container-low text-primary",
  "bg-primary-fixed text-on-primary-fixed",
  "bg-tertiary-fixed-dim text-on-tertiary-fixed",
  "bg-secondary-fixed text-on-secondary-fixed"
];

export default function HomePage() {
  const { toast } = useToast();
  const timer = useCountdown(4 * 3600 + 22 * 60 + 45);
  const [tab, setTab] = useState(FEATURED_TABS[0].id);
  const [lang, setLang] = useState<"EN | हिं" | "हिं | EN">("EN | हिं");

  const categories = useCategories();
  const flashDeals = useProducts({ isFlashDeal: true, limit: 8 });
  const featured = useProducts(useMemo(() => FEATURED_TABS.find((t) => t.id === tab)!.params, [tab]));
  const bundle = useProducts({ q: "Kharif", limit: 1 });

  const heroBundle = bundle.data?.items[0];

  return (
    <AppShellLayout>
      <div className="flex flex-col gap-space-lg py-space-lg">
        {/* 1 · Location, weather & Kisan AI strip */}
        <section className="px-margin md:px-margin-desktop flex flex-col gap-space-xs">
          <div className="flex items-center justify-between gap-space-xs py-space-xs px-space-sm bg-surface-container-low rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name="pin_drop" filled className="text-[18px] text-primary" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider">
                    Deliver to
                  </span>
                  <button className="font-label-sm text-label-sm text-primary font-bold hover:underline" onClick={() => toast("PIN code picker coming soon", "info")}>
                    Change
                  </button>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface font-semibold truncate">
                  Nashik, Maharashtra - 422003
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed shrink-0">
              <Icon name="wb_sunny" className="text-[16px] text-tertiary-container animate-spin [animation-duration:16s]" />
              <div className="flex flex-col items-end leading-none">
                <span className="font-label-sm text-label-sm font-bold">28°C Sunny</span>
                <span className="font-label-sm text-[9px] text-on-tertiary-fixed-variant font-medium">Ideal for Spraying</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-space-sm py-2 rounded-xl bg-surface-container-lowest shadow-sm gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <Icon name="psychology" className="text-[18px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1">
                  Kisan AI Assistant
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                </span>
                <span className="font-body-sm text-body-sm text-outline truncate">
                  “Meri fasal ke keede ke liye dawa batao”
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="px-2 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold"
                onClick={() => setLang((l) => (l === "EN | हिं" ? "हिं | EN" : "EN | हिं"))}
              >
                {lang}
              </button>
              <button
                aria-label="Voice search"
                onClick={() => toast("Voice search activated — bol kar bolein", "info")}
                className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <Icon name="mic" className="text-[19px]" />
              </button>
            </div>
          </div>
        </section>

        {/* 2 · Hero banner */}
        <section className="px-margin md:px-margin-desktop">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-inverse-surface">
            <div
              className="w-full h-56 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB3V23FUo7scyZkT3l4oTKl0RpY9PAmcz_I6brqaSSsI41cX5AikznyFmGfxP4k3OuWDHKhYaumsRgHw1WaVVixVuWguNamCCPTgw2vAZtOXhvySc2L8vL_AMkDLaNAcofEp2503opbxkKV3OXkDkp2nqlHCOyVrGOriD5PkQKfPsABQFeBy9gt2pr2aVPqXlnIfOqW5RkyLerUudTtiOlI-mioQYrOxz1R_PgTmg')"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-space-lg flex flex-col justify-end text-on-primary">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container/90 text-on-primary-container backdrop-blur-md self-start mb-2 shadow-sm">
                <Icon name="verified_user" className="text-[14px]" />
                <span className="font-label-sm text-label-sm font-bold tracking-wide">
                  100% Genuine Agri-Inputs | Govt Approved
                </span>
              </div>
              <h1 className="font-headline-lg-mobile md:font-headline-xl text-headline-lg-mobile md:text-headline-xl font-extrabold text-on-primary leading-tight">
                Everything You Need for Better Farming
              </h1>
              <p className="font-body-sm text-body-sm text-surface-container-highest/90 line-clamp-2 mt-1">
                Certified seeds, crop nutrition &amp; farm machinery directly delivered to your village within 48 hours.
              </p>
              <div className="flex items-center gap-space-xs mt-3">
                <Link to="/products">
                  <Button variant="primary" className="bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed" icon="arrow_forward">
                    Shop Now
                  </Button>
                </Link>
                <div className="px-3 py-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl font-label-md text-label-md font-bold flex items-center gap-1">
                  <Icon name="local_fire_department" className="text-[16px] text-tertiary" />
                  Kharif Deals • 40% OFF
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Categories */}
        <section className="px-margin md:px-margin-desktop flex flex-col gap-space-xs">
          <SectionHeader title="Categories" icon="category" actionLabel="View All" actionTo="/products" />
          {categories.isLoading ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : categories.isError ? (
            <ErrorState title="Couldn’t load categories" description={categories.error.message} onAction={() => categories.refetch()} />
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
              {categories.data?.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/products?category=${c.slug}`}
                  className="flex flex-col items-center text-center p-2 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-level2 transition-shadow group"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform",
                      CATEGORY_TONES[i % CATEGORY_TONES.length]
                    )}
                  >
                    <Icon name={c.icon} className="text-[26px]" />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">{c.name}</span>
                  <span className="font-label-sm text-[10px] text-outline mt-0.5">{c.subtitle}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 4 · Flash deals */}
        <section className="flex flex-col gap-space-xs">
          <div className="px-margin md:px-margin-desktop flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-2 py-1 rounded-lg bg-error-container text-on-error-container flex items-center gap-1 font-label-md text-label-md font-bold">
                <Icon name="bolt" className="text-[16px] text-error" />
                Flash Mandi Deals
              </div>
              <div className="flex items-center gap-1 font-label-sm text-label-sm font-bold text-error bg-surface-container-low px-2 py-0.5 rounded-md tabular">
                <Icon name="timer" className="text-[14px]" />
                <span>{timer}</span>
              </div>
            </div>
            <Link to="/products?isFlashDeal=true" className="font-label-md text-label-md text-primary font-bold">
              See All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-margin md:px-margin-desktop no-scrollbar pb-1 pt-0.5">
            {flashDeals.isLoading &&
              Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} variant="deal" />)}
            {flashDeals.data?.items.map((p) => <ProductCard key={p.id} product={p} variant="deal" />)}
            {flashDeals.isSuccess && flashDeals.data.items.length === 0 && (
              <p className="font-body-sm text-body-sm text-outline px-1 py-6">No flash deals live right now — check back soon.</p>
            )}
          </div>
        </section>

        {/* 5 · Season advisor bundle */}
        <section className="px-margin md:px-margin-desktop">
          <div className="p-space-lg rounded-2xl bg-gradient-to-br from-surface-container to-surface-container-high relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="agriculture" className="text-primary text-[20px]" />
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
                  Kharif Season Advisor
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                Maharashtra Zone
              </span>
            </div>
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold mt-1.5">
              Sowing to Harvest Protection Bundle
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Curated for Cotton, Soybean &amp; Grapes farmers in western Maharashtra. Protects against early leaf curl
              &amp; fungal damp-off.
            </p>
            <div className="flex items-center gap-2 mt-3 py-2 px-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm">
              <Icon name="auto_fix_high" className="text-primary text-[22px]" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                  Includes: Mahyco Bio-tonic + Neem Oil 10000 PPM + Trichoderma
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-price-card text-primary font-bold text-base tabular">
                    {formatINR(heroBundle?.price ?? 1149)}
                  </span>
                  <span className="font-body-sm text-[12px] text-outline line-through tabular">
                    {formatINR(heroBundle?.mrp ?? 1599)}
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary font-bold bg-tertiary-fixed px-1 rounded">
                    Save {formatINR((heroBundle?.mrp ?? 1599) - (heroBundle?.price ?? 1149))} Bundle Discount
                  </span>
                </div>
              </div>
            </div>
            <Link to={heroBundle ? `/product/${heroBundle.slug}` : "/products"}>
              <Button size="lg" fullWidth className="mt-3" icon="package_2">
                Add Full Kharif Bundle ({formatINR(heroBundle?.price ?? 1149)})
              </Button>
            </Link>
          </div>
        </section>

        {/* 6 · Featured catalog */}
        <section className="px-margin md:px-margin-desktop flex flex-col gap-space-xs">
          <SectionHeader title="Featured Catalog" actionLabel="Browse All" actionTo="/products" />
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {FEATURED_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3.5 py-2 rounded-full font-label-md text-label-md shrink-0 transition-colors",
                  tab === t.id
                    ? "bg-primary text-on-primary font-semibold shadow-sm"
                    : "bg-surface-container-high text-on-surface font-medium hover:bg-surface-container-highest"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
            {featured.isLoading && Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            {featured.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 7 · Farmer voices */}
        <section className="px-margin md:px-margin-desktop flex flex-col gap-space-xs">
          <SectionHeader
            title="Farmer Voices"
            icon="groups"
            subtitle="Trusted by 5,00,000+ Indian farmers across 19,000 pincodes"
          />
          <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  className="w-12 h-12 rounded-full object-cover bg-surface-container-low"
                  alt="Ramesh Patil"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-vyqt3YPN3ov_T3sXpAnYuyi3A5EX6hUGKVBrGwroib3Vtkkku5NiX4EPAxd9Zzdak2rvEdvn5DhDBKutwTGKAYVjgx9AsVbVzyJN9yqBwR63TbGBA_ZRk0ceaKBiYIa7_9X3arIXHFPhYtMUle8_M-cr4cBH9Hns5xSC1fHssyrF1Wz8ea_mHUOX-VSeomQnyIXaaa4HtK73HaYE-Nak1Hqpa9uAzOZLQNi4sQ"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-title-md text-title-md text-on-surface font-bold">Ramesh Patil</span>
                    <Icon name="verified" filled className="text-primary text-[16px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">Nashik • Grapes &amp; Pomegranate Grower</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-tertiary-container">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" filled className="text-[16px]" />
                ))}
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant italic">
              “Earlier I had to travel 25 km to city mandi for genuine Bayer spray and often got duplicate stocks.
              KrishiBazaar delivered original batch directly to my farm in 48 hours at lower price!”
            </p>
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-xl">
              <div className="flex items-center gap-1.5">
                <Icon name="storefront" className="text-primary text-[18px]" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                  2,400+ Licensed Agri-Dealers Network
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold">100% Tax Invoice</span>
            </div>
          </div>
        </section>

        {/* 8 · Trust grid */}
        <section className="px-margin md:px-margin-desktop pt-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { icon: "verified", title: "100% Genuine", desc: "Direct from licensed manufacturers with lab certificates", tone: "bg-primary-fixed text-on-primary-fixed" },
              { icon: "local_shipping", title: "Village Delivery", desc: "Doorstep dispatch to 19,000+ Indian postal codes", tone: "bg-secondary-container text-on-secondary-container" },
              { icon: "payments", title: "Kisan Friendly Pay", desc: "Cash on Delivery, UPI, & Kisan Credit Card accepted", tone: "bg-tertiary-fixed text-on-tertiary-fixed" },
              { icon: "support_agent", title: "Free Agri Advisory", desc: "Dial 1800-KRISHI for free crop doctor support", tone: "bg-surface-container-highest text-primary" }
            ].map((item) => (
              <div key={item.title} className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.tone)}>
                  <Icon name={item.icon} className="text-[18px]" />
                </div>
                <h4 className="font-title-md text-[14px] text-on-surface font-bold leading-tight">{item.title}</h4>
                <p className="font-body-sm text-[11px] text-outline leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 9 · Helpline */}
        <section className="px-margin md:px-margin-desktop pb-2">
          <div className="p-3 rounded-2xl bg-primary text-on-primary flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-on-primary/10 flex items-center justify-center">
                <Icon name="phone_in_talk" className="text-[22px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-primary-fixed font-bold">
                  Kisan Call Helpline (Toll-Free)
                </span>
                <span className="font-title-md text-title-md font-extrabold tracking-wide">1800-266-9999</span>
              </div>
            </div>
            <a
              href="tel:18002669999"
              className="h-9 px-3.5 bg-surface-container-lowest text-primary rounded-xl font-title-md text-[13px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
              Call Now
            </a>
          </div>
        </section>
      </div>
    </AppShellLayout>
  );
}
