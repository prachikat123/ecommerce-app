import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteSellerProduct, useSellerOrders, useSellerProducts, useSellerStats } from "../api/hooks";
import { SellerGate } from "../components/SellerGate";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { StatSkeleton } from "../components/Skeletons";
import { EmptyState, ErrorState } from "../components/States";
import { useSession } from "../store/SessionContext";
import { useToast } from "../store/ToastContext";
import { formatCount, formatINR, formatDate, classForOrderStatus } from "../lib/format";
import { cn } from "../lib/cn";

const MANDI_RATES = [
  { crop: "Hybrid Tomato", price: "₹2,200", unit: "/qtl", delta: "+8.2%", tone: "text-secondary" },
  { crop: "Red Onion (Nashik)", price: "₹3,400", unit: "/qtl", delta: "+3.4%", tone: "text-secondary" },
  { crop: "Cotton (Medium)", price: "₹7,100", unit: "/qtl", delta: "0.0%", tone: "text-outline" }
];

function stockTone(stock: number): string {
  if (stock === 0) return "bg-error-container text-on-error-container";
  if (stock <= 5) return "bg-tertiary-fixed text-on-tertiary-fixed";
  return "bg-secondary-fixed/50 text-on-secondary-fixed-variant";
}

function stockDot(stock: number): string {
  if (stock === 0) return "bg-error";
  if (stock <= 5) return "bg-tertiary";
  return "bg-secondary";
}

export default function SellerDashboardPage() {
  return (
    <SellerGate>
      <Dashboard />
    </SellerGate>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signInAs } = useSession();
  const stats = useSellerStats();
  const products = useSellerProducts();
  const orders = useSellerOrders();
  const deleteProduct = useDeleteSellerProduct();
  const [query, setQuery] = useState("");

  const shopName = user?.shopName ?? "Agri Store";
  const revenue = stats.data?.revenue ?? 0;
  const orderCount = stats.data?.orderCount ?? 0;
  const unitsSold = stats.data?.unitsSold ?? 0;
  const avgOrderValue = stats.data?.avgOrderValue ?? 0;
  const lowStock = stats.data?.lowStock ?? 0;
  const outOfStock = stats.data?.outOfStock ?? 0;
  const productCount = stats.data?.productCount ?? 0;

  const productList = products.data ?? [];
  const orderList = orders.data ?? [];

  const filteredProducts = productList.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.category?.name.toLowerCase().includes(q) ?? false)
    );
  });

  /* Category mix for the Live Catalog footer. */
  const catCounts = new Map<string, number>();
  for (const p of productList) {
    const name = p.category?.name ?? "Other";
    catCounts.set(name, (catCounts.get(name) ?? 0) + 1);
  }
  const catSummary =
    Array.from(catCounts.entries())
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(" • ") || "No live listings yet";

  /* Fulfillment breakdown from the seller order feed. */
  const totalOrders = orderList.length;
  const deliveredOrders = orderList.filter((o) => o.status === "DELIVERED").length;
  const transitOrders = orderList.filter((o) => o.status === "PACKED" || o.status === "SHIPPED").length;
  const pendingOrders = orderList.filter((o) => !["DELIVERED", "PACKED", "SHIPPED", "CANCELLED"].includes(o.status)).length;
  const pct = (n: number) => (totalOrders ? Math.round((n / totalOrders) * 100) : 0);
  const successRate = totalOrders ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : "0.0";
  const C = 238;
  const deliveredArc = totalOrders ? (deliveredOrders / totalOrders) * C : 0;
  const transitArc = totalOrders ? (transitOrders / totalOrders) * C : 0;
  const pendingArc = totalOrders ? (pendingOrders / totalOrders) * C : 0;

  const kpis = [
    {
      label: "Gross Sales (MTD)",
      value: formatINR(revenue),
      icon: "currency_rupee",
      iconWrap: "bg-primary/10 text-primary",
      badge: { icon: "trending_up", text: `${formatCount(orderCount)} orders`, className: "text-secondary bg-secondary-fixed/30" },
      footLeft: ["Avg Order", formatINR(avgOrderValue)],
      footRight: ["Units Sold", formatCount(unitsSold)]
    },
    {
      label: "Total Dispatches",
      value: formatCount(orderCount),
      icon: "local_shipping",
      iconWrap: "bg-secondary/10 text-secondary",
      badge: { icon: "arrow_upward", text: `${formatCount(unitsSold)} units`, className: "text-secondary bg-secondary-fixed/30" },
      footLeft: ["Fulfilled", formatCount(deliveredOrders)],
      footRight: ["Open", formatCount(Math.max(totalOrders - deliveredOrders, 0))]
    },
    {
      label: "Live Catalog",
      value: `${formatCount(productCount)} SKUs`,
      icon: "eco",
      iconWrap: "bg-surface-container-high text-primary",
      badge: { icon: "warning", text: `${formatCount(lowStock)} Low Stock`, className: "text-tertiary bg-tertiary-fixed/60" },
      footLeft: ["Top Categories", catSummary],
      footRight: null
    },
    {
      label: "Avg. Order Value",
      value: formatINR(avgOrderValue),
      icon: "payments",
      iconWrap: "bg-tertiary-fixed/50 text-tertiary",
      badge: { icon: "error", text: `${formatCount(outOfStock)} Out of Stock`, className: "text-error bg-error-container" },
      footLeft: ["Low Stock", formatCount(lowStock)],
      footRight: ["Out of Stock", formatCount(outOfStock)]
    }
  ];

  const fulfillment = [
    { label: "Delivered & Settled", count: deliveredOrders, pct: pct(deliveredOrders), dot: "bg-primary", tone: "text-secondary" },
    { label: "In-Transit / Packed", count: transitOrders, pct: pct(transitOrders), dot: "bg-secondary-fixed", tone: "text-on-surface-variant" },
    { label: "Pending Confirmation", count: pendingOrders, pct: pct(pendingOrders), dot: "bg-tertiary-fixed-dim", tone: "text-tertiary" }
  ];

  const removeProduct = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteProduct.mutate(id, {
      onSuccess: () => toast(`${name} deleted`, "success"),
      onError: (err) => toast(err.message, "error")
    });
  };

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-xl max-w-6xl mx-auto w-full">
        {/* ───────── Top bar: greeting, status ticker & actions ───────── */}
        <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-xl shadow-sm">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-md flex-wrap">
              <h1 className="font-headline-sm text-headline-sm md:font-headline-md md:text-headline-md font-extrabold text-on-surface tracking-tight">
                Namaste, {shopName} <span aria-hidden>👋</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-surface-container-low text-secondary font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Mandi Dispatches Normal • 98.4% On-Time Delivery
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Real-time overview of your harvest sales, direct farm dispatches, and APMC mandi market demand across your region.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-md">
            <Button variant="ghost" size="md" icon="swap_horiz" onClick={() => void signInAs("CUSTOMER")}>
              Switch to Buyer
            </Button>
            <Link to="/seller/products/new">
              <Button size="md" icon="add_circle">Add Crop / Input</Button>
            </Link>
          </div>
        </section>

        {/* ───────── KPI metric cards ───────── */}
        {stats.isLoading ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </section>
        ) : stats.isError ? (
          <ErrorState title="Couldn’t load dashboard" description={stats.error.message} onAction={() => stats.refetch()} />
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
            {kpis.map((k) => (
              <div key={k.label} className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{k.label}</span>
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", k.iconWrap)}>
                      <Icon name={k.icon} className="text-[22px]" />
                    </div>
                  </div>
                  <div className="mt-space-md flex items-baseline gap-space-sm flex-wrap">
                    <span className="font-price-hero text-price-hero text-on-surface tracking-tight tabular">{k.value}</span>
                    <span className={cn("inline-flex items-center gap-0.5 font-label-md text-label-md px-1.5 py-0.5 rounded", k.badge.className)}>
                      <Icon name={k.badge.icon} className="text-[14px]" />
                      {k.badge.text}
                    </span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-md bg-surface-container-low/50 -mx-space-xl -mb-space-xl px-space-xl py-space-sm rounded-b-xl">
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-between gap-2">
                    <span className="truncate">
                      {k.footLeft[0]}: <strong className="text-on-surface font-semibold">{k.footLeft[1]}</strong>
                    </span>
                    {k.footRight && (
                      <span className="shrink-0">
                        {k.footRight[0]}: <strong className="text-on-surface font-semibold">{k.footRight[1]}</strong>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ───────── Stock alert tiles ───────── */}
        {stats.isSuccess && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            {[
              { icon: "warning", label: "Low stock", value: lowStock, tone: "text-tertiary" },
              { icon: "error", label: "Out of stock", value: outOfStock, tone: "text-error" },
              { icon: "check_circle", label: "Live products", value: productCount, tone: "text-secondary" }
            ].map((a) => (
              <div key={a.label} className="rounded-xl bg-surface-container-low p-space-md flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
                  <Icon name={a.icon} className={cn("text-[18px]", a.tone)} filled /> {a.label}
                </span>
                <span className={cn("font-title-lg text-title-lg font-bold tabular", a.tone)}>{a.value}</span>
              </div>
            ))}
          </section>
        )}

        {/* ───────── Low stock nudge ───────── */}
        {lowStock > 0 && (
          <div className="rounded-xl bg-tertiary-fixed/60 px-3 py-2 flex items-center gap-2">
            <Icon name="warning" className="text-tertiary text-[20px]" filled />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {lowStock} product(s) are low on stock — restock soon to avoid missed orders.
            </span>
          </div>
        )}

        {/* ───────── APMC mandi price intelligence banner ───────── */}
        <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary shrink-0">
                <Icon name="price_change" className="text-[24px]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-title-md text-title-md text-on-surface">APMC Mandi Price Intelligence Feed</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold">Live Rate Sync</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Lasalgaon &amp; Vashi Mandi average benchmarks for today's market opening.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-md">
              {MANDI_RATES.map((m) => (
                <div key={m.crop} className="bg-surface-container px-space-md py-1.5 rounded-lg flex items-center gap-space-sm">
                  <span className="font-title-md text-title-md text-on-surface">{m.crop}:</span>
                  <span className="font-price-card text-price-card text-primary font-bold tabular">
                    {m.price}
                    <span className="text-xs font-normal text-on-surface-variant">{m.unit}</span>
                  </span>
                  <span className={cn("text-xs font-bold", m.tone)}>{m.delta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Fulfillment & status ───────── */}
        <section className="bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-xl shadow-sm">
          <div className="pb-space-md">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Fulfillment &amp; Status</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Dispatch status breakdown for {formatCount(orderCount)} orders
            </p>
          </div>

          {orders.isLoading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : totalOrders === 0 ? (
            <p className="font-body-sm text-body-sm text-outline py-space-md">
              No dispatches yet. Fulfillment status will appear here once buyers check out.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center gap-space-lg">
              <div className="relative flex items-center justify-center my-space-md shrink-0">
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eaedff" strokeWidth="12" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#00652c" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${deliveredArc} ${C}`} strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#6bff8f" strokeWidth="12" strokeDasharray={`${transitArc} ${C}`} strokeDashoffset={-deliveredArc} />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffb77d" strokeWidth="12" strokeDasharray={`${pendingArc} ${C}`} strokeDashoffset={-(deliveredArc + transitArc)} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-headline-md text-headline-md text-on-surface tabular">{successRate}%</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Delivered</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-space-sm">
                {fulfillment.map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", row.dot)} />
                      <span className="font-title-md text-title-md text-on-surface truncate">{row.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-title-md text-title-md text-on-surface tabular">{formatCount(row.count)}</span>
                      <span className={cn("font-label-sm text-label-sm font-bold ml-1", row.tone)}>({row.pct}%)</span>
                    </div>
                  </div>
                ))}
                <Link
                  to="/seller/orders"
                  className="w-full mt-space-sm py-2.5 text-center font-title-md text-title-md text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  Manage Dispatch Schedule
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ───────── Products & seed batches table ───────── */}
        <section id="products" className="bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">My Products &amp; Seed Batches</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-semibold text-primary">
                  {formatCount(productCount)} SKUs
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time inventory levels and pricing for your farm-gate listings.</p>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="relative">
                <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by product or SKU..."
                  aria-label="Filter products"
                  className="h-9 pl-9 pr-space-md rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-52"
                />
              </div>
              <Link to="/seller/products/new" className="font-title-md text-title-md text-primary hover:underline whitespace-nowrap">
                + Add New
              </Link>
            </div>
          </div>

          {products.isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          )}

          {products.isError && (
            <ErrorState title="Couldn’t load products" description={products.error.message} onAction={() => products.refetch()} />
          )}

          {products.isSuccess && productList.length === 0 && (
            <EmptyState
              icon="add_box"
              title="No products yet"
              description="Publish your first agri-input to start receiving orders."
              actionLabel="Add Product"
              onAction={() => navigate("/seller/products/new")}
            />
          )}

          {products.isSuccess && productList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider bg-surface-container-low/60">
                    <th className="py-3 px-space-md rounded-l-lg">Product &amp; Packaging</th>
                    <th className="py-3 px-space-md">Category</th>
                    <th className="py-3 px-space-md text-right">Price</th>
                    <th className="py-3 px-space-md text-center">Stock Status</th>
                    <th className="py-3 px-space-md text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-space-md px-space-md">
                        <div className="flex items-center gap-space-md">
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-surface-container shrink-0" />
                          <div className="min-w-0">
                            <Link to={`/product/${p.slug}`} className="font-title-md text-title-md text-on-surface truncate block hover:text-primary">
                              {p.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
                              <span className="font-medium text-xs">{p.packSizes[0] ?? p.unit}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-tertiary font-semibold text-xs">
                                <Icon name="star" filled className="text-[14px]" />
                                {p.rating.toFixed(1)} ({formatCount(p.ratingCount)})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface whitespace-nowrap">
                          {p.category?.name ?? p.brand}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-price-card text-price-card text-primary tabular whitespace-nowrap">
                        {formatINR(p.price)}
                      </td>
                      <td className="py-space-md px-space-md text-center">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold whitespace-nowrap", stockTone(p.stock))}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", stockDot(p.stock))} />
                          {p.stock === 0 ? "Out of stock" : `${formatCount(p.stock)} in stock`}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/product/${p.slug}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors whitespace-nowrap"
                          >
                            Details
                          </Link>
                          <button
                            aria-label={`Delete ${p.name}`}
                            onClick={() => removeProduct(p.id, p.name)}
                            disabled={deleteProduct.isPending}
                            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/40 disabled:opacity-50"
                          >
                            <Icon name="delete" className="text-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <p className="py-space-lg text-center font-body-sm text-body-sm text-outline">
                  No products match “{query}”.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ───────── Recent orders ───────── */}
        <section className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-space-lg border-b border-outline-variant/40">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-1.5">
              <Icon name="receipt_long" className="text-primary text-[20px]" filled /> Recent Orders
            </h2>
            <Link to="/seller/orders" className="font-label-md text-label-md text-primary font-bold">
              Manage
            </Link>
          </div>

          {orders.isError && (
            <ErrorState title="Couldn’t load orders" description={orders.error.message} onAction={() => orders.refetch()} />
          )}

          {orders.isSuccess && orderList.length === 0 && (
            <p className="p-space-lg font-body-sm text-body-sm text-outline">No orders yet. New orders will appear here.</p>
          )}

          {orders.isSuccess && orderList.length > 0 && (
            <ul className="divide-y divide-outline-variant/30">
              {orderList.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                    <Icon name="shopping_bag" className="text-[20px] text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-title-md text-[14px] font-semibold text-on-surface">{o.orderNumber}</p>
                    <p className="font-body-sm text-body-sm text-outline">
                      {o.user?.name ?? "Customer"} · {formatDate(o.createdAt)} · {o.itemCount} item(s)
                    </p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold", classForOrderStatus(o.status))}>
                    {o.status}
                  </span>
                  <span className="font-label-md text-label-md font-bold tabular hidden sm:block">{formatINR(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ───────── Advisory quick-action mosaic ───────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name="receipt_long" className="text-[24px]" />
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface">Automated Mandi E-Way Bills</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Generate state inter-district transit permits and electronic tax invoices for batch consignments over ₹50,000 instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast("Transit pass generation is coming soon", "info")}
              className="mt-space-lg text-left font-title-md text-title-md text-primary hover:underline flex items-center gap-1"
            >
              Generate Transit Pass
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>

          <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <Icon name="ac_unit" className="text-[24px]" />
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface">Cold-Hub Allocation</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Reserve temperature-controlled storage for tomato &amp; table grape harvest batches across your nearest cold chain bay.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast("Cold-hub slot booking is coming soon", "info")}
              className="mt-space-lg text-left font-title-md text-title-md text-secondary hover:underline flex items-center gap-1"
            >
              Check Slot Capacity
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>

          <div className="p-space-xl rounded-xl bg-primary text-on-primary shadow-sm flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-on-primary">
                <Icon name="support_agent" className="text-[24px]" />
              </div>
              <h3 className="font-title-lg text-title-lg text-on-primary">Need Bulk Dispatch Assistance?</h3>
              <p className="font-body-sm text-body-sm text-on-primary/80">
                Dedicated Agronomist &amp; Dispatch Coordinator for bulk FPO consignments. Call toll-free or initiate a WhatsApp ticket.
              </p>
            </div>
            <div className="mt-space-lg flex items-center gap-space-md flex-wrap">
              <a
                href="https://wa.me/919800042200"
                target="_blank"
                rel="noreferrer"
                className="px-space-md py-2 bg-on-primary text-primary font-title-md text-title-md rounded-lg shadow-sm hover:bg-surface-bright transition-colors"
              >
                Chat on WhatsApp
              </a>
              <span className="font-label-md text-label-md text-on-primary/90">Toll Free: 1800-266-9999</span>
            </div>
          </div>
        </section>
      </div>
    </AppShellLayout>
  );
}
