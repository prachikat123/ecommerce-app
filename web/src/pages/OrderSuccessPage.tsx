import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useOrder } from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { ErrorState } from "../components/States";
import { formatINR, formatDateTime, formatDate, classForOrderStatus } from "../lib/format";
import { cn } from "../lib/cn";

const STEPS = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

const STEP_DETAILS: Record<(typeof STEPS)[number], { title: string; icon: string; desc: string }> = {
  CONFIRMED: {
    title: "Order Confirmed",
    icon: "receipt_long",
    desc: "Direct routing accepted by the Krishi Nashik Rural Hub."
  },
  PACKED: {
    title: "Packed & Quality Checked",
    icon: "inventory_2",
    desc: "Inputs packed and batch-verified at the Nashik Agro Hub."
  },
  SHIPPED: {
    title: "Dispatched from Nashik Agro Hub",
    icon: "local_shipping",
    desc: "Handed over to Krishi Rural Logistics for village transit."
  },
  DELIVERED: {
    title: "Village Hub Delivery",
    icon: "home",
    desc: "Final drop-off at your Gram Panchayat / farm gate."
  }
};

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = useOrder(id);
  const [copied, setCopied] = useState(false);

  const copyOrderId = (value: string) => {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => undefined
    );
  };

  if (order.isLoading) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-3">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </AppShellLayout>
    );
  }

  if (order.isError || !order.data) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg">
          <ErrorState
            title="Order not found"
            description={order.error?.message ?? "We couldn't find that order."}
            onAction={() => navigate("/profile")}
          />
        </div>
      </AppShellLayout>
    );
  }

  const o = order.data;
  const cancelled = o.status === "CANCELLED";
  const delivered = o.status === "DELIVERED";
  const activeIndex = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const eta = new Date(new Date(o.createdAt).getTime() + 4 * 86400000);
  const paymentLabel =
    o.paymentMethod === "COD"
      ? "Cash on Delivery"
      : o.paymentMethod === "KCC"
        ? "Kisan Credit Card"
        : o.paymentMethod === "UPI"
          ? "UPI"
          : "Debit / Credit Card";
  const paidLabel = o.paymentStatus === "PAID" ? "Total Amount Paid" : "Total Payable";

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-lg max-w-3xl mx-auto w-full">
        {/* Celebration Top Hero Section */}
        <div className="relative flex flex-col items-center text-center pt-space-md pb-space-sm overflow-hidden">
          {!cancelled && (
            <>
              <div className="absolute -top-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-2 left-6 text-tertiary-container animate-pulse pointer-events-none opacity-80">
                <Icon name="eco" className="text-[20px]" />
              </div>
              <div className="absolute top-6 right-8 text-secondary pointer-events-none opacity-70">
                <Icon name="grain" className="text-[24px]" />
              </div>
              <div className="absolute top-16 left-12 text-tertiary pointer-events-none opacity-60">
                <Icon name="celebration" className="text-[16px]" />
              </div>
              <div className="absolute top-14 right-14 text-primary pointer-events-none opacity-75">
                <Icon name="verified" className="text-[18px]" />
              </div>
            </>
          )}

          <div className="relative mb-space-md">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center shadow-lg relative z-10",
                cancelled ? "bg-error-container" : "bg-primary-fixed"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-inner",
                  cancelled ? "bg-error text-on-error" : "bg-primary text-on-primary"
                )}
              >
                <Icon name={cancelled ? "cancel" : "check"} filled className="text-[42px] font-bold" />
              </div>
            </div>
            {!cancelled && (
              <div className="absolute -inset-2 rounded-full bg-primary/15 animate-ping opacity-40 pointer-events-none" />
            )}
            {!cancelled && (
              <div className="absolute -bottom-1 -right-1 bg-tertiary-container text-on-tertiary-container rounded-full px-2 py-0.5 font-label-sm text-label-sm shadow flex items-center gap-0.5 z-20">
                <Icon name="verified_user" className="text-[12px]" />
                <span>ICAR Assured</span>
              </div>
            )}
          </div>

          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight mb-space-xs">
            {cancelled ? "Order Cancelled" : "Order Placed Successfully! 🎉"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm leading-relaxed px-space-xs">
            {cancelled ? (
              "This order was cancelled. Reach out to our helpline for any refund queries."
            ) : (
              <>
                Dhanyawad! Your order has been confirmed with{" "}
                <span className="font-semibold text-primary">KrishiBazaar</span> and routed to our{" "}
                <span className="font-semibold text-on-surface">Nashik Rural Hub</span>.
              </>
            )}
          </p>
          <div className="mt-space-md inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface-variant shadow-sm">
            <Icon name="mark_chat_unread" className="text-primary text-[18px]" />
            <span className="font-label-md text-label-md">Updates sent via SMS &amp; WhatsApp</span>
          </div>
        </div>

        {/* Primary Order Identifier & Key Metadata Card */}
        <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Order ID
              </span>
              <div className="flex items-center gap-space-xs mt-0.5">
                <span className="font-title-lg text-title-lg font-bold text-on-surface tracking-tight">
                  #{o.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyOrderId(o.orderNumber)}
                  title="Copy Order ID"
                  aria-label="Copy Order ID"
                  className="relative w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="content_copy" className="text-[16px]" />
                  {copied && (
                    <span className="absolute -top-7 px-2 py-0.5 rounded bg-inverse-surface text-inverse-on-surface font-label-sm text-[10px] whitespace-nowrap shadow">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {paidLabel}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-price-card text-price-card font-extrabold text-primary tabular">
                  {formatINR(o.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Banner */}
          <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-secondary-container/30 text-on-secondary-container">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
              <Icon name="savings" className="text-[18px] text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md font-semibold truncate">{paymentLabel}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                Placed on {formatDateTime(o.createdAt)}
              </p>
            </div>
            <span
              className={cn(
                "font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest font-bold shrink-0",
                o.paymentStatus === "PAID" ? "text-secondary" : "text-tertiary"
              )}
            >
              {o.paymentStatus}
            </span>
          </div>

          {/* Delivery & Village Logistics Overview */}
          <div className="pt-space-xs flex items-start gap-space-sm">
            <Icon name="local_shipping" className="text-tertiary-container text-[20px] mt-0.5" />
            <div className="flex-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Estimated Hub Delivery
              </span>
              <p className="font-title-md text-title-md font-bold text-on-surface">
                {cancelled ? "Order cancelled" : delivered ? "Delivered" : `Estimated by ${formatDate(eta.toISOString())}`}
              </p>
              {!cancelled && (
                <p className="font-body-sm text-body-sm text-primary font-medium">
                  Guaranteed by 6:00 PM via Krishi Rural Logistics
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Items Quick Snapshot */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-1.5">
              <Icon name="inventory_2" className="text-primary text-[20px]" />
              <h2 className="font-title-md text-title-md font-bold text-on-surface">Ordered Agricultural Inputs</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
                {o.itemCount} Item{o.itemCount === 1 ? "" : "s"}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold",
                  classForOrderStatus(o.status)
                )}
              >
                {o.status}
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-md">
            {o.items.map((line) => (
              <div key={line.id} className="flex items-center gap-space-sm">
                <div className="w-14 h-14 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={line.image ?? ""} alt={line.productName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{line.productName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {line.brand}
                    {line.unit ? ` • ${line.unit}` : ""} • Qty: {line.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-title-md text-title-md font-bold text-on-surface tabular">
                    {formatINR(line.lineTotal)}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t border-outline-variant/50 pt-3 flex flex-col gap-1.5 font-body-sm text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="tabular font-semibold">{formatINR(o.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Delivery</span>
                <span className={cn("tabular font-semibold", o.deliveryFee === 0 && "text-secondary")}>
                  {o.deliveryFee === 0 ? "FREE" : formatINR(o.deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-title-lg">
                <span className="font-bold">{paidLabel}</span>
                <span className="font-price-card text-price-card text-primary font-extrabold tabular">
                  {formatINR(o.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Order Journey / Tracking Mini-Timeline */}
        {cancelled ? (
          <section className="rounded-xl bg-error-container/40 p-space-lg flex items-start gap-space-sm">
            <Icon name="cancel" className="text-error text-[22px]" />
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">This order was cancelled</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Reach out to our agronomy helpline below for any refund or re-order queries.
              </p>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-1.5">
                <Icon name="conversion_path" className="text-primary text-[20px]" />
                <h2 className="font-title-md text-title-md font-bold text-on-surface">Delivery Journey Preview</h2>
              </div>
              {delivered ? (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold",
                    classForOrderStatus(o.status)
                  )}
                >
                  {o.status}
                </span>
              ) : (
                <span className="font-label-sm text-label-sm text-primary font-bold flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" /> Live Tracking
                </span>
              )}
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="relative flex flex-col gap-space-lg pl-6">
                <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-surface-container-highest" />
                {STEPS.map((step, i) => {
                  const isDone = i < activeIndex || (i === activeIndex && delivered);
                  const isCurrent = i === activeIndex && !delivered;
                  const detail = STEP_DETAILS[step];
                  return (
                    <div
                      key={step}
                      className={cn("relative flex items-start gap-space-md", !isDone && !isCurrent && "opacity-60")}
                    >
                      <div
                        className={cn(
                          "absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow",
                          isDone
                            ? "bg-primary text-on-primary"
                            : isCurrent
                              ? "bg-tertiary-container text-on-tertiary-container animate-pulse"
                              : "bg-surface-container-high text-on-surface-variant"
                        )}
                      >
                        <Icon name={isDone ? "check" : detail.icon} className="text-[13px]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              "font-body-md text-body-md font-bold",
                              isCurrent ? "text-tertiary-container" : "text-on-surface"
                            )}
                          >
                            {detail.title}
                          </p>
                          {isCurrent && (
                            <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">
                              In Progress
                            </span>
                          )}
                          {isDone && i === 0 && (
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {formatDateTime(o.createdAt)}
                            </span>
                          )}
                          {isDone && i === STEPS.length - 1 && (
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Completed</span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{detail.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address + Payment Recap */}
        <div className="grid sm:grid-cols-2 gap-space-md">
          <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-1.5">
            <h3 className="font-title-md text-title-md font-bold flex items-center gap-1.5">
              <Icon name="location_on" className="text-[18px] text-primary" /> Delivery Address
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface font-semibold">{o.addressName}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{o.addressLine}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {o.addressCity}, {o.addressState} — {o.addressPincode}
            </p>
            <p className="font-body-sm text-body-sm text-outline">Phone: {o.addressPhone}</p>
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-1.5">
            <h3 className="font-title-md text-title-md font-bold flex items-center gap-1.5">
              <Icon name="payments" className="text-[18px] text-primary" /> Payment
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface font-semibold">{paymentLabel}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Status:{" "}
              <span className={o.paymentStatus === "PAID" ? "text-secondary font-semibold" : "text-tertiary font-semibold"}>
                {o.paymentStatus}
              </span>
            </p>
            <p className="font-body-sm text-body-sm text-outline">Placed on {formatDateTime(o.createdAt)}</p>
            {o.notes && <p className="font-body-sm text-body-sm text-outline">Note: {o.notes}</p>}
          </section>
        </div>

        {/* Reassurance & Farmer Support Contact */}
        <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-sm">
          <div className="flex items-start gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon name="support_agent" className="text-[22px]" />
            </div>
            <div className="flex-1">
              <p className="font-title-md text-title-md font-bold text-on-surface">
                Kisan Agronomy &amp; Order Helpline
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Need to change quantity, delivery spot, or ask agronomy questions? Speak with our agronomist in Marathi
                or Hindi.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-space-xs gap-space-sm">
            <a
              href="tel:18002669999"
              className="flex-1 py-2 px-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-center gap-1.5 text-on-surface shadow-sm hover:bg-surface-container transition-colors"
            >
              <Icon name="call" className="text-primary text-[18px]" />
              <span className="font-label-md text-label-md font-bold">1800-266-9999</span>
              <span className="font-label-sm text-[9px] text-primary px-1 rounded bg-surface-container-high font-bold">
                TOLL-FREE
              </span>
            </a>
          </div>
        </div>

        {/* Bottom Interactive CTA Group */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button fullWidth size="lg" icon="storefront" onClick={() => navigate("/products")}>
            Continue Shopping
          </Button>
          <Link to="/profile" className="w-full">
            <Button fullWidth size="lg" variant="secondary" icon="receipt_long">
              My Orders
            </Button>
          </Link>
        </div>
      </div>
    </AppShellLayout>
  );
}
