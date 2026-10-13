import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSellerOrders, useUpdateOrderStatus } from "../api/hooks";
import { SellerGate } from "../components/SellerGate";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { EmptyState, ErrorState } from "../components/States";
import { useToast } from "../store/ToastContext";
import { formatCount, formatINR, classForOrderStatus } from "../lib/format";
import { cn } from "../lib/cn";

const FILTERS = ["ALL", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED"
};

const STATUS_ICON: Record<string, string> = {
  CONFIRMED: "done",
  PACKED: "inventory_2",
  SHIPPED: "local_shipping",
  DELIVERED: "verified",
  CANCELLED: "close"
};

const TAB_BADGE: Record<string, string> = {
  CONFIRMED: "bg-surface-container-high text-on-surface",
  PACKED: "bg-surface-variant text-on-surface",
  SHIPPED: "bg-surface-container-highest text-on-surface",
  DELIVERED: "bg-secondary-fixed text-on-secondary-fixed",
  CANCELLED: "bg-error-container text-on-error-container"
};

const PAYMENT_OPTIONS = [
  { value: "ALL", label: "Payment: All Modes" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "KCC", label: "Kisan Credit Card (RuPay)" },
  { value: "COD", label: "Cash on Delivery" }
];

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function paymentMeta(method: string): { icon: string; label: string } {
  switch (method) {
    case "COD":
      return { icon: "payments", label: "Cash on Delivery" };
    case "UPI":
      return { icon: "check_circle", label: "UPI" };
    case "KCC":
      return { icon: "credit_card", label: "KCC (RuPay)" };
    case "CARD":
      return { icon: "credit_card", label: "Card" };
    default:
      return { icon: "payments", label: method };
  }
}

function splitDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  };
}

export default function SellerOrdersPage() {
  return (
    <SellerGate>
      <OrdersBoard />
    </SellerGate>
  );
}

function OrdersBoard() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("ALL");
  const orders = useSellerOrders(filter === "ALL" ? undefined : filter);
  const allOrders = useSellerOrders(undefined);
  const updateStatus = useUpdateOrderStatus();

  const advance = (id: string, current: string) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    updateStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => toast(`Order marked ${next}`, "success"),
        onError: (err) => toast(err.message, "error")
      }
    );
  };

  const cancel = (id: string) => {
    if (!window.confirm("Cancel this order?")) return;
    updateStatus.mutate(
      { id, status: "CANCELLED" },
      {
        onSuccess: () => toast("Order cancelled", "info"),
        onError: (err) => toast(err.message, "error")
      }
    );
  };

  const all = allOrders.data ?? [];
  const counts: Record<string, number> = { ALL: all.length };
  for (const status of ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]) {
    counts[status] = all.filter((o) => o.status === status).length;
  }
  const allItems = all.reduce((sum, o) => sum + o.itemCount, 0);
  const deliveredValue = all
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.total, 0);

  const term = search.trim().toLowerCase();
  const rows = (orders.data ?? []).filter((o) => {
    if (payment !== "ALL" && o.paymentMethod !== payment) return false;
    if (!term) return true;
    const haystack = [
      o.orderNumber,
      o.user?.name,
      o.user?.phone,
      o.addressName,
      o.addressPhone,
      ...o.items.map((i) => i.productName)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  const resetFilters = () => {
    setSearch("");
    setPayment("ALL");
  };

  const exportCsv = () => {
    const header = ["Order ID", "Customer", "Phone", "City", "Items", "Amount", "Payment", "Status", "Ordered At"];
    const lines = rows.map((o) => [
      o.orderNumber,
      o.user?.name ?? o.addressName,
      o.user?.phone ?? o.addressPhone,
      `${o.addressCity}, ${o.addressState}`,
      o.itemCount,
      o.total,
      o.paymentMethod,
      o.status,
      new Date(o.createdAt).toISOString()
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "seller-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-lg lg:py-space-xl max-w-[1440px] mx-auto w-full space-y-space-lg lg:space-y-space-xl">
        {/* Top banner, breadcrumb & header actions */}
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
              <Link to="/" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-on-surface font-semibold">Orders</span>
            </nav>
            <div className="flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-on-surface">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim animate-pulse" />
              <span className="font-label-md text-label-md font-semibold">Seller Order Sync: Live</span>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
            <div className="max-w-3xl">
              <div className="flex items-center gap-space-sm mb-space-xs flex-wrap">
                <span className="px-space-sm py-0.5 rounded text-on-tertiary-fixed bg-tertiary-fixed font-label-sm text-label-sm tracking-wide uppercase font-bold">
                  Seller Fulfilment Desk
                </span>
                <span className="px-space-sm py-0.5 rounded text-on-primary-container bg-primary-container font-label-sm text-label-sm tracking-wide font-medium">
                  Western MH FPO Network
                </span>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-xl md:text-headline-xl text-on-surface tracking-tight font-extrabold">
                Orders Management &amp; Dispatch Desk
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-1.5 leading-relaxed">
                Track, pack, and fulfil farmer orders across Western Maharashtra delivery clusters — advance each order from
                Confirmed to Delivered, or cancel before dispatch.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm sm:gap-space-md shrink-0">
              <button
                type="button"
                onClick={exportCsv}
                disabled={rows.length === 0}
                className="flex items-center gap-space-xs px-space-md h-12 rounded-lg bg-surface-container-lowest text-on-surface font-title-md text-title-md shadow-sm hover:bg-surface-container-high transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Icon name="download" className="text-[20px] text-primary" />
                <span>Export Orders</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <StatTile
            label="Total Orders"
            value={formatCount(counts.ALL)}
            icon="inventory_2"
            iconTone="bg-surface-container-high text-primary"
            valueTone="text-on-surface"
            pill={
              <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-high text-secondary font-label-md text-label-md font-bold">
                <Icon name="trending_up" className="text-[14px]" /> {formatCount(allItems)} items sold
              </span>
            }
            foot="All statuses"
          />
          <StatTile
            label="Needs Immediate Packing"
            value={`${counts.CONFIRMED} Orders`}
            icon="timer"
            iconTone="bg-tertiary-fixed text-tertiary"
            valueTone="text-tertiary"
            pill={
              <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md font-bold">
                <Icon name="warning" className="text-[14px]" /> Action required
              </span>
            }
            foot="Confirmed, awaiting pack"
          />
          <StatTile
            label="In-Transit / Dispatch"
            value={`${counts.SHIPPED} Shipments`}
            icon="local_shipping"
            iconTone="bg-surface-container-high text-primary"
            valueTone="text-on-surface"
            pill={
              <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary" /> Out for delivery
              </span>
            }
            foot="Rural van routes"
          />
          <StatTile
            label="Delivered & Settled"
            value={`${counts.DELIVERED} Orders`}
            icon="task_alt"
            iconTone="bg-surface-container-high text-secondary"
            valueTone="text-primary"
            pill={
              <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-high text-primary font-label-md text-label-md font-bold">
                {formatINR(deliveredValue)} Settled
              </span>
            }
            foot="Collected revenue"
          />
        </div>

        {/* Status filter tabs with live counts */}
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm">
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map((f) => {
              const active = filter === f;
              const badgeCls = active ? "bg-surface-container-lowest/20 text-on-primary" : TAB_BADGE[f] ?? "bg-surface-container-high text-on-surface";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-title-md text-title-md transition-all shrink-0",
                    active ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <span>{f === "ALL" ? "All Orders" : titleCase(f)}</span>
                  <span className={cn("px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold", badgeCls)}>
                    {formatCount(counts[f] ?? 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & search control toolbar */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
            <div className="md:col-span-6 relative">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Order ID, farmer name, mobile number, or crop SKU…"
                type="text"
                className="w-full h-12 pl-11 pr-space-md bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
              />
            </div>
            <div className="md:col-span-3 relative">
              <select
                aria-label="Payment Mode"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="w-full h-12 px-space-md bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {PAYMENT_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                title="Reset search criteria"
                className="w-full h-12 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center justify-center gap-1 transition-all"
              >
                <Icon name="restart_alt" className="text-[18px]" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders table */}
        {orders.isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {orders.isError && (
          <ErrorState title="Couldn’t load orders" description={orders.error.message} onAction={() => orders.refetch()} />
        )}

        {orders.isSuccess && rows.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm">
            <EmptyState
              icon="receipt_long"
              title={term || payment !== "ALL" ? "No matching orders" : filter === "ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
              description={
                term || payment !== "ALL"
                  ? "Try adjusting your search or payment filter."
                  : "Orders from buyers will show up here as soon as they check out."
              }
            />
          </div>
        )}

        {orders.isSuccess && rows.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1080px]">
                <thead>
                  <tr className="bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider select-none">
                    <th className="py-space-md px-space-md" scope="col">Order ID</th>
                    <th className="py-space-md px-space-md" scope="col">Customer</th>
                    <th className="py-space-md px-space-md" scope="col">Product</th>
                    <th className="py-space-md px-space-md" scope="col">Quantity</th>
                    <th className="py-space-md px-space-md" scope="col">Amount</th>
                    <th className="py-space-md px-space-md" scope="col">Payment</th>
                    <th className="py-space-md px-space-md" scope="col">Status</th>
                    <th className="py-space-md px-space-md" scope="col">Order Date</th>
                    <th className="py-space-md px-space-md text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {rows.map((o) => {
                    const first = o.items[0];
                    const pay = paymentMeta(o.paymentMethod);
                    const when = splitDateTime(o.createdAt);
                    const extraItems = o.items.length - 1;
                    return (
                      <tr key={o.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="py-space-md px-space-md align-top">
                          <div className="font-title-md text-title-md font-bold text-on-surface">{o.orderNumber}</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <Icon name="bolt" className="text-[14px] text-tertiary" />
                            {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                          </div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <div className="font-title-md text-title-md text-on-surface font-semibold">{o.user?.name ?? o.addressName ?? "Customer"}</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">{o.user?.phone ?? o.addressPhone}</div>
                          <div className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5 mt-0.5">
                            <Icon name="location_on" className="text-[13px]" />
                            {o.addressCity}, {o.addressState}
                          </div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <div className="flex items-center gap-space-sm min-w-[220px]">
                            <img
                              src={first?.image ?? ""}
                              alt={first?.productName ?? ""}
                              className="w-12 h-12 rounded-lg object-cover bg-surface-container-high shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-title-md text-title-md text-on-surface font-semibold truncate" title={first?.productName}>
                                {first?.productName ?? "—"}
                              </div>
                              <div className="font-body-sm text-body-sm text-on-surface-variant">
                                {extraItems > 0 ? `+${extraItems} more item${extraItems === 1 ? "" : "s"}` : first?.unit ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <span className="px-space-xs py-1 rounded bg-surface-container font-label-md text-label-md font-bold text-on-surface">
                            {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <div className="font-price-card text-price-card font-extrabold text-on-surface tabular">{formatINR(o.total)}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Includes taxes &amp; delivery</div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold">
                            <Icon name={pay.icon} className="text-[13px]" />
                            {pay.label}
                          </span>
                          <div className="font-label-sm text-label-sm text-secondary font-medium mt-0.5">{o.paymentStatus}</div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-space-sm py-1 rounded-full font-label-md text-label-md font-bold",
                              classForOrderStatus(o.status)
                            )}
                          >
                            <Icon name={STATUS_ICON[o.status] ?? "receipt_long"} className="text-[15px]" />
                            {titleCase(o.status)}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <div className="font-body-sm text-body-sm text-on-surface font-medium">{when.date}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{when.time}</div>
                        </td>
                        <td className="py-space-md px-space-md align-top text-right">
                          <div className="flex items-center justify-end gap-space-xs">
                            {NEXT_STATUS[o.status] && (
                              <Button size="sm" icon="arrow_forward" loading={updateStatus.isPending} onClick={() => advance(o.id, o.status)}>
                                Mark {titleCase(NEXT_STATUS[o.status])}
                              </Button>
                            )}
                            {(o.status === "CONFIRMED" || o.status === "PACKED") && (
                              <Button size="sm" variant="ghost" disabled={updateStatus.isPending} onClick={() => cancel(o.id)}>
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-outline-variant/30">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Showing <strong className="text-on-surface font-semibold">{formatCount(rows.length)}</strong> of{" "}
                <strong className="text-on-surface font-semibold">{formatCount(counts.ALL)}</strong> orders
              </span>
              {orders.isFetching && <span className="font-label-sm text-label-sm text-on-surface-variant">Refreshing…</span>}
            </div>
          </div>
        )}

        {/* Bottom logistics / dispatch alert bar */}
        <div className="rounded-xl p-space-lg bg-surface-container flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <Icon name="local_shipping" className="text-[24px]" />
            </div>
            <div>
              <div className="flex items-center gap-space-xs flex-wrap">
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Rural Dispatch Desk</h2>
                <span className="px-space-xs py-0.5 rounded text-on-tertiary-fixed bg-tertiary-fixed font-label-sm text-label-sm font-bold uppercase">
                  {counts.CONFIRMED} to pack
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Keep orders moving through Confirmed → Packed → Shipped → Delivered.{" "}
                <strong className="text-on-surface font-semibold">{counts.SHIPPED}</strong> shipment(s) currently in transit to
                village drop points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShellLayout>
  );
}

function StatTile({
  label,
  value,
  icon,
  iconTone,
  valueTone,
  pill,
  foot
}: {
  label: string;
  value: string;
  icon: string;
  iconTone: string;
  valueTone: string;
  pill: ReactNode;
  foot: string;
}) {
  return (
    <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-space-sm">
        <div>
          <span className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider">{label}</span>
          <div className={cn("font-headline-lg-mobile text-headline-lg-mobile sm:font-headline-xl sm:text-headline-xl font-extrabold mt-1", valueTone)}>
            {value}
          </div>
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconTone)}>
          <Icon name={icon} className="text-[26px]" />
        </div>
      </div>
      <div className="mt-space-md pt-space-sm flex items-center justify-between gap-space-sm flex-wrap">
        {pill}
        <span className="font-body-sm text-body-sm text-on-surface-variant">{foot}</span>
      </div>
    </div>
  );
}
