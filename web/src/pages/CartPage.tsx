import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useCart,
  useClearCart,
  useProduct,
  useRelatedProducts,
  useRemoveCartItem,
  useUpdateCartItem
} from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { QuantityStepper } from "../components/QuantityStepper";
import { DiscountBadge } from "../components/Badges";
import { FavoriteButton, ProductCard } from "../components/ProductCard";
import { CartLineSkeleton } from "../components/Skeletons";
import { EmptyState, ErrorState } from "../components/States";
import { useToast } from "../store/ToastContext";
import { formatINR } from "../lib/format";
import { cn } from "../lib/cn";

const FREE_DELIVERY_THRESHOLD = 999;
const STANDARD_DELIVERY_FEE = 80;

export default function CartPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const [coupon, setCoupon] = useState("");

  // Personalised add-on suggestions from the first cart line.
  const firstItem = cart.data?.items[0];
  const firstProduct = useProduct(firstItem?.productId);
  const related = useRelatedProducts(firstProduct.data?.slug);

  const busy = updateItem.isPending || removeItem.isPending || clearCart.isPending;

  if (cart.isLoading) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-md">
          <div className="skeleton h-8 w-48 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <CartLineSkeleton key={i} />
          ))}
        </div>
      </AppShellLayout>
    );
  }

  if (cart.isError || !cart.data) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg">
          <ErrorState
            title="Couldn’t load your cart"
            description={cart.error?.message ?? "Please try again."}
            onAction={() => cart.refetch()}
          />
        </div>
      </AppShellLayout>
    );
  }

  const data = cart.data;

  if (data.items.length === 0) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-xl">
          <EmptyState
            icon="shopping_cart"
            title="Your cart is empty"
            description="Add certified seeds, fertiliser or equipment to start your kharif order."
            actionLabel="Shop Agri-Inputs"
            onAction={() => navigate("/products")}
          />
        </div>
      </AppShellLayout>
    );
  }

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - data.subtotal);
  const progress = Math.min(100, Math.round((data.subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const freeDelivery = data.deliveryFee === 0;

  const onQty = (itemId: string, quantity: number, name: string) => {
    updateItem.mutate(
      { itemId, quantity },
      { onError: (err) => toast(err.message, "error") }
    );
    if (quantity === 0) toast(`${name} removed`, "info");
  };

  const clear = () =>
    clearCart.mutate(undefined, {
      onSuccess: () => toast("Cart cleared", "info"),
      onError: (err) => toast(err.message, "error")
    });

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop pt-space-sm pb-32 md:pb-10 flex flex-col gap-space-lg">
        <h1 className="sr-only">My Cart</h1>

        {/* ───────── Stepper checkout flow ───────── */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-space-xs z-10">
              <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-sm text-label-sm">
                1
              </div>
              <span className="font-label-md text-label-md text-primary font-bold whitespace-nowrap">Cart ({data.itemCount})</span>
            </div>
            <div className="h-0.5 flex-1 bg-surface-container-high mx-space-xs" />
            <div className="flex items-center gap-space-xs z-10 opacity-60">
              <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                2
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Delivery</span>
            </div>
            <div className="h-0.5 flex-1 bg-surface-container-high mx-space-xs" />
            <div className="flex items-center gap-space-xs z-10 opacity-60">
              <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                3
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Payment</span>
            </div>
          </div>
        </div>

        {/* ───────── Delivery hub & free-delivery meter ───────── */}
        <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-space-xs min-w-0">
              <Icon name="local_shipping" className="text-primary text-[20px] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Delivering to</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold truncate">
                  Nashik, 422003 (Village Hub)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast("Manage delivery addresses from your profile", "info")}
              className="bg-surface-container-lowest text-primary font-label-md text-label-md px-space-md py-1.5 rounded-full shadow-sm shrink-0"
            >
              Change
            </button>
          </div>

          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-primary min-w-0">
                <Icon name={freeDelivery ? "verified" : "local_shipping"} className="text-[18px] shrink-0" />
                <span className="font-label-sm text-label-sm font-semibold text-primary truncate">
                  {freeDelivery
                    ? "🎉 You have unlocked FREE Village Delivery!"
                    : `Add ${formatINR(remaining)} more for FREE Village Delivery`}
                </span>
              </div>
              <span
                className={cn(
                  "font-label-sm text-label-sm shrink-0",
                  freeDelivery ? "text-on-surface-variant line-through" : "text-on-surface-variant"
                )}
              >
                {freeDelivery ? formatINR(STANDARD_DELIVERY_FEE) : formatINR(data.deliveryFee)}
              </span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ───────── Mandi savings highlight pill ───────── */}
        <div className="bg-on-tertiary-container rounded-xl p-space-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
              <Icon name="trending_down" className="text-[22px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-title-md font-bold text-on-tertiary-fixed">
                Save {formatINR(data.savings)} vs Mandi Rates
              </span>
              <span className="font-body-sm text-body-sm text-tertiary">Direct farm gate pricing verified by APMC Nashik</span>
            </div>
          </div>
          <Icon name="info" className="text-tertiary text-[20px] shrink-0" />
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-space-lg items-start">
          {/* ───────── Cart items + add-ons ───────── */}
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Cart Items ({data.itemCount})</h2>
              <button
                type="button"
                onClick={clear}
                disabled={busy}
                className="font-label-sm text-label-sm text-error font-bold hover:underline disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            {data.items.map((line) => (
              <div
                key={line.id}
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md animate-fade-in"
              >
                <div className="flex gap-space-md">
                  <Link
                    to={`/product/${line.productId}`}
                    className="relative w-24 h-24 rounded-lg bg-surface-container-low shrink-0 overflow-hidden flex items-center justify-center"
                  >
                    <img src={line.image} alt={line.name} className="w-full h-full object-cover" />
                    {line.mrp > line.price && (
                      <span className="absolute top-1 left-1">
                        <DiscountBadge percent={Math.round((1 - line.price / line.mrp) * 100)} size="sm" />
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5 min-w-0">
                      <span className="font-label-sm text-label-sm text-primary font-bold truncate">{line.brand}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-0.5 shrink-0">
                        <Icon name="verified_user" className="text-[13px] text-primary" /> Govt Certified
                      </span>
                    </div>
                    <Link
                      to={`/product/${line.productId}`}
                      className="font-title-md text-title-md text-on-surface font-semibold truncate hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 truncate">
                      Pack: {line.unit ?? "—"}
                    </span>
                    <div className="flex items-baseline gap-space-xs mt-space-xs">
                      <span className="font-price-card text-price-card text-on-surface tabular">{formatINR(line.price)}</span>
                      {line.mrp > line.price && (
                        <span className="font-body-sm text-body-sm text-outline line-through tabular">{formatINR(line.mrp)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-space-xs gap-2 flex-wrap">
                  <QuantityStepper
                    size="sm"
                    value={line.quantity}
                    max={Math.max(1, line.stock)}
                    disabled={busy}
                    onChange={(next) => onQty(line.id, next, line.name)}
                  />
                  <div className="flex items-center gap-space-sm">
                    <FavoriteButton productId={line.productId} />
                    <button
                      type="button"
                      onClick={() =>
                        removeItem.mutate(
                          { itemId: line.id },
                          {
                            onSuccess: () => toast(`${line.name} removed`, "info"),
                            onError: (err) => toast(err.message, "error")
                          }
                        )
                      }
                      disabled={busy}
                      className="flex items-center gap-1 font-label-md text-label-md text-error p-2 rounded-lg bg-surface-container-low active:bg-surface-container disabled:opacity-50"
                    >
                      <Icon name="delete" className="text-[16px]" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>

                {line.stock <= 0 ? (
                  <div className="bg-error-container px-space-sm py-1.5 rounded-lg flex items-center gap-2">
                    <Icon name="error" className="text-[16px] text-on-error-container shrink-0" />
                    <span className="font-body-sm text-body-sm text-on-error-container font-semibold truncate">
                      Out of stock — please remove this item to continue
                    </span>
                  </div>
                ) : line.stock <= 5 ? (
                  <div className="bg-surface-container-low px-space-sm py-1.5 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-space-xs min-w-0">
                      <Icon name="warning" className="text-[16px] text-tertiary shrink-0" />
                      <span className="font-body-sm text-body-sm text-tertiary font-semibold truncate">
                        Only {line.stock} left in stock at Nashik Hub
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold shrink-0">Fast Moving</span>
                  </div>
                ) : (
                  <div className="bg-surface-container-low px-space-sm py-1.5 rounded-lg flex items-center gap-2">
                    <Icon name="bolt" className="text-[16px] text-primary shrink-0" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Dispatch within 24 hrs from <strong className="text-on-surface">Nashik Warehouse</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Coupon & Kisan subsidy */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <Icon name="redeem" className="text-primary text-[22px]" />
                <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                  Apply Coupon or DBT / Subsidy Voucher
                </h3>
              </div>
              <div className="flex items-center gap-space-xs">
                <div className="flex-1 flex items-center h-12 px-space-md rounded-lg bg-surface-container-low">
                  <Icon name="confirmation_number" className="text-outline text-[18px] mr-space-xs shrink-0" />
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter Govt Voucher or Code"
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toast("Coupons & subsidies are validated at checkout", "info")}
                  className="h-12 px-space-lg bg-surface-container-highest text-on-surface font-label-md text-label-md rounded-lg font-bold"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Recommended add-ons */}
            {related.data && related.data.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-on-surface">
                    <Icon name="eco" className="text-[20px] text-primary" />
                    <h3 className="font-title-md text-title-md font-bold">Essential Seed Care Add-on</h3>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container-lowest px-2 py-0.5 rounded-full text-primary font-semibold shrink-0">
                    Recommended
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {related.data.slice(0, 6).map((rp) => (
                    <ProductCard key={rp.id} product={rp} variant="deal" />
                  ))}
                </div>
              </div>
            )}

            {/* Trust & farmer guarantee badges */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-space-md">
              {[
                { icon: "payments", title: "COD & KCC Accepted", sub: "Pay cash at farm gate or swipe Kisan Credit Card" },
                { icon: "verified", title: "Germination Guarantee", sub: "7-day hassle-free replacement for genuine issues" },
                { icon: "gavel", title: "100% ICAR Approved", sub: "Certified genuine inputs directly from manufacturers" }
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                    <Icon name={b.icon} className="text-[20px]" />
                  </div>
                  <div className="flex flex-col">
                    <h5 className="font-title-md text-title-md text-on-surface font-bold">{b.title}</h5>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{b.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ───────── Order summary ───────── */}
          <aside className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md lg:sticky lg:top-20">
            <div className="flex items-center justify-between gap-2 pb-space-xs">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Price Details ({data.itemCount} Items)</h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Tax Invoice Included</span>
            </div>

            <div className="flex flex-col gap-space-sm font-body-md text-body-md">
              <Row label="Total MRP" value={formatINR(data.mrpTotal)} />
              <Row label="Product Discount" value={`- ${formatINR(data.savings)}`} tone="success" />
              <Row label="APMC Mandi Cess / Agri Tax" value="FREE" tone="success" />
              <Row
                label="Village Delivery Charge"
                value={freeDelivery ? "FREE" : formatINR(data.deliveryFee)}
                tone={freeDelivery ? "success" : undefined}
              />
            </div>

            <div className="h-0.5 bg-surface-container-low my-space-xs" />

            <div className="flex justify-between items-baseline gap-2">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Total Amount</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">GST included for all inputs</span>
              </div>
              <span className="font-price-hero text-price-hero text-primary tabular">{formatINR(data.total)}</span>
            </div>

            <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-xs">
              <Icon name="savings" className="text-primary text-[20px] shrink-0" />
              <span className="font-label-md text-label-md text-primary font-bold">
                🌾 You will save {formatINR(data.savings)} on this order!
              </span>
            </div>

            <Button size="lg" fullWidth icon="lock" onClick={() => navigate("/checkout")}>
              Proceed to Checkout
            </Button>
            <Button variant="soft" fullWidth icon="arrow_back" onClick={() => navigate("/products")}>
              Continue Shopping
            </Button>
          </aside>
        </div>
      </div>

      {/* ───────── Sticky bottom checkout bar (mobile) ───────── */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-xl px-gutter py-space-sm md:hidden">
        <div className="flex items-center justify-between gap-space-md">
          <div className="flex flex-col shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Total:</span>
              <span className="font-price-card text-price-card text-on-surface tabular">{formatINR(data.total)}</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-semibold">Saved {formatINR(data.savings)}</span>
          </div>
          <Button size="lg" icon="arrow_forward" className="flex-1" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </AppShellLayout>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={cn("tabular font-semibold", tone === "success" ? "text-secondary" : "text-on-surface")}>{value}</dd>
    </div>
  );
}
