import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddresses, useCart, useCheckout } from "../api/hooks";
import { ApiClientError } from "../api/client";
import type { CheckoutInput } from "../api/types";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { EmptyState } from "../components/States";
import { useSession } from "../store/SessionContext";
import { useToast } from "../store/ToastContext";
import { formatINR } from "../lib/format";
import { cn } from "../lib/cn";

type PaymentMethod = CheckoutInput["paymentMethod"];

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: string;
  badge?: { text: string; className: string };
  right?: string;
  cashback?: boolean;
  providers?: string[];
}

const PAYMENTS: PaymentOption[] = [
  {
    id: "UPI",
    label: "UPI Payments",
    desc: "GPay, PhonePe, Paytm, BHIM UPI",
    icon: "qr_code_2",
    badge: { text: "Recommended", className: "bg-secondary-container text-on-secondary-container" },
    cashback: true,
    providers: ["GPay", "PhonePe", "Paytm", "BHIM UPI"]
  },
  {
    id: "KCC",
    label: "Kisan Credit Card (KCC)",
    desc: "RuPay Kisan Card, SBI Agri Card",
    icon: "account_balance",
    badge: { text: "0% Interest", className: "bg-surface-container text-on-surface-variant" }
  },
  {
    id: "CARD",
    label: "Debit / Credit Card",
    desc: "Visa, Mastercard, RuPay",
    icon: "credit_card"
  },
  {
    id: "COD",
    label: "Cash on Delivery / Pay at Gate",
    desc: "Pay in cash or scan the delivery agent’s QR code upon package inspection at your farm",
    icon: "payments",
    right: "Zero Advance"
  }
];

const TRUST = [
  {
    icon: "verified_user",
    tint: "text-primary",
    title: "100% ICAR & Govt Certified Sourcing",
    desc: "Every batch tested for pure germination rate and seed viability"
  },
  {
    icon: "published_with_changes",
    tint: "text-tertiary-container",
    title: "7-Day Germination Replacement Guarantee",
    desc: "Free replacement if seeds fail lab germination criteria"
  },
  {
    icon: "encrypted",
    tint: "text-secondary",
    title: "Secure 256-Bit Encrypted Agricultural Portal",
    desc: "Protected payments under RBI and Agri Stack safety standards"
  }
];

const CHECKOUT_STEPS = [
  { label: "Address", state: "done" },
  { label: "Delivery", state: "done" },
  { label: "Payment", state: "active" },
  { label: "Review", state: "todo" }
] as const;

interface FormState {
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter the full name";
  if (!/^[6-9]\d{9}$/.test(form.phone.trim())) errors.phone = "Enter a valid 10-digit mobile number";
  if (form.line.trim().length < 4) errors.line = "Enter your village, street and house no.";
  if (form.city.trim().length < 2) errors.city = "Enter your city or taluka";
  if (form.state.trim().length < 2) errors.state = "Enter your state";
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid 6-digit PIN code";
  return errors;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  line: "",
  city: "Nashik",
  state: "Maharashtra",
  pincode: "",
  label: "Home",
  notes: ""
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { toast } = useToast();
  const cart = useCart();
  const addresses = useAddresses();
  const checkout = useCheckout();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Prefill from the most recent saved address, then fall back to the session user.
  const prefill = useMemo(() => {
    const addr = addresses.data?.[0];
    return {
      name: addr?.name ?? user?.name ?? "",
      phone: addr?.phone ?? user?.phone ?? "",
      line: addr?.line ?? "",
      city: addr?.city ?? "Nashik",
      state: addr?.state ?? "Maharashtra",
      pincode: addr?.pincode ?? ""
    };
  }, [addresses.data, user]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || prefill.name,
      phone: prev.phone || prefill.phone,
      line: prev.line || prefill.line,
      pincode: prev.pincode || prefill.pincode
    }));
  }, [prefill]);

  const items = cart.data?.items ?? [];
  const isEmpty = cart.isSuccess && items.length === 0;

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (touched) setErrors(validate({ ...form, [key]: value }));
  };

  const submit = () => {
    setTouched(true);
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormOpen(true);
      toast("Please fix the highlighted fields", "error");
      return;
    }

    checkout.mutate(
      {
        paymentMethod: payment,
        address: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          line: form.line.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          label: form.label.trim() || undefined
        },
        notes: form.notes.trim() || undefined
      },
      {
        onSuccess: (order) => {
          toast(`Order ${order.orderNumber} placed!`, "success");
          navigate(`/order/${order.orderNumber}`);
        },
        onError: (err) => {
          setFormOpen(true);
          if (err instanceof ApiClientError && err.details) {
            const mapped: Errors = {};
            for (const d of err.details) {
              const key = d.path.replace("address.", "") as keyof FormState;
              mapped[key] = d.message;
            }
            setErrors((prev) => ({ ...prev, ...mapped }));
          }
          toast(err.message, "error");
        }
      }
    );
  };

  if (cart.isLoading) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg">
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </AppShellLayout>
    );
  }

  if (isEmpty) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-xl">
          <EmptyState
            icon="shopping_cart"
            title="Nothing to checkout"
            description="Your cart is empty — add a few certified agri-inputs first."
            actionLabel="Shop Now"
            onAction={() => navigate("/products")}
          />
        </div>
      </AppShellLayout>
    );
  }

  const data = cart.data!;
  const addressComplete = Boolean(
    form.name.trim() && form.phone.trim() && form.line.trim() && form.pincode.trim()
  );
  const showForm = formOpen || !addressComplete;
  const itemLabel = `${data.itemCount} Item${data.itemCount === 1 ? "" : "s"}`;

  return (
    <AppShellLayout>
      <div className="pb-20 md:pb-0">
        {/* Stepper Progress Tracker */}
        <section className="px-margin md:px-margin-desktop pt-space-md pb-space-sm bg-surface-container-lowest shadow-sm mb-space-md">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-6 right-6 top-4 h-1 bg-surface-container-high rounded-full" />
            <div className="absolute left-6 w-2/3 top-4 h-1 bg-primary-container rounded-full transition-all duration-500" />
            {CHECKOUT_STEPS.map((step, index) => (
              <div key={step.label} className="flex flex-col items-center gap-1 z-10">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    step.state === "todo"
                      ? "bg-surface-container text-on-surface-variant"
                      : "bg-primary-container text-on-primary shadow-sm",
                    step.state === "active" && "shadow-md ring-4 ring-on-primary-container"
                  )}
                >
                  {step.state === "done" ? (
                    <Icon name="check" className="text-[18px]" />
                  ) : (
                    <span className="font-label-md text-label-md font-bold">
                      {index + 1}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-label-sm text-label-sm",
                    step.state === "todo"
                      ? "text-on-surface-variant"
                      : step.state === "active"
                        ? "text-on-surface font-bold"
                        : "text-primary-container font-semibold"
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="px-margin md:px-margin-desktop flex flex-col gap-space-md">
          <div className="grid lg:grid-cols-[1fr_360px] gap-space-lg items-start">
            <div className="flex flex-col gap-space-md">
              {/* Step 1: Delivery Address */}
              <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-outline-variant/40">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="check" className="text-[15px]" />
                    </span>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">1. Delivery Address</h2>
                  </div>
                  {addressComplete && (
                    <button
                      type="button"
                      onClick={() => setFormOpen((v) => !v)}
                      className="font-label-md text-label-md text-primary font-bold px-2 py-1 rounded bg-surface-container-low hover:bg-surface-container"
                    >
                      {formOpen ? "Cancel" : "Change"}
                    </button>
                  )}
                </div>

                {!showForm ? (
                  <div className="bg-surface-container-low rounded-lg p-space-md">
                    <div className="flex items-center justify-between gap-space-xs mb-1.5">
                      <span className="font-title-md text-title-md text-on-surface font-bold">{form.name}</span>
                      <span className="bg-primary-container text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                        {form.label || "Home"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                        +91 {form.phone}
                      </span>
                      <span className="inline-flex items-center gap-0.5 bg-surface-container-highest text-secondary font-label-sm text-[10px] px-1.5 py-0.5 rounded">
                        <Icon name="verified" className="text-[12px]" /> OTP Verified
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {form.line}, {form.city}, {form.state} - {form.pincode}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5 text-primary">
                      <Icon name="local_shipping" className="text-[16px]" />
                      <span className="font-label-sm text-label-sm font-semibold">
                        Eligible for Village Van &amp; Farm Gate drop
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-space-md">
                    <div className="grid sm:grid-cols-2 gap-space-md">
                      <Field label="Full Name" error={touched ? errors.name : undefined}>
                        <input
                          className={inputCls(touched && !!errors.name)}
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="e.g. Ramesh V. Patil"
                          autoComplete="name"
                        />
                      </Field>
                      <Field label="Mobile Number" error={touched ? errors.phone : undefined}>
                        <div className="flex items-center gap-2">
                          <div className="h-12 px-3 rounded-lg bg-surface-container-low flex items-center gap-1 font-body-md text-body-md text-on-surface font-semibold shrink-0">
                            <span>🇮🇳</span> +91
                          </div>
                          <input
                            className={cn(inputCls(touched && !!errors.phone), "flex-1")}
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit number"
                            inputMode="numeric"
                            autoComplete="tel"
                          />
                        </div>
                      </Field>
                      <Field
                        label="Farm / Gate Location & Landmark"
                        error={touched ? errors.line : undefined}
                        className="sm:col-span-2"
                      >
                        <textarea
                          className={cn(inputCls(touched && !!errors.line), "h-20 py-2 resize-none")}
                          value={form.line}
                          onChange={(e) => set("line", e.target.value)}
                          placeholder="Gat No, Plot / Landmark near village"
                          autoComplete="street-address"
                        />
                      </Field>
                      <Field label="Pincode" error={touched ? errors.pincode : undefined}>
                        <input
                          className={inputCls(touched && !!errors.pincode)}
                          value={form.pincode}
                          onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="422003"
                          inputMode="numeric"
                          autoComplete="postal-code"
                        />
                      </Field>
                      <Field label="City / District" error={touched ? errors.city : undefined}>
                        <input
                          className={inputCls(touched && !!errors.city)}
                          value={form.city}
                          onChange={(e) => set("city", e.target.value)}
                        />
                      </Field>
                      <Field label="State" error={touched ? errors.state : undefined}>
                        <input
                          className={inputCls(touched && !!errors.state)}
                          value={form.state}
                          onChange={(e) => set("state", e.target.value)}
                        />
                      </Field>
                      <Field label="Save as" error={undefined}>
                        <select
                          className={inputCls(false)}
                          value={form.label}
                          onChange={(e) => set("label", e.target.value)}
                        >
                          <option value="Home">Home</option>
                          <option value="Farm">Farm</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                )}
              </section>

              {/* Step 2: Delivery Method */}
              <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-outline-variant/40">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="check" className="text-[15px]" />
                    </span>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">2. Delivery Method</h2>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Nashik Hub</span>
                </div>
                <div className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low">
                  <Icon name="agriculture" className="text-[20px] text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-title-md text-title-md text-on-surface font-bold">
                        Standard Village Delivery
                      </span>
                      {data.deliveryFee === 0 ? (
                        <span className="font-label-md text-label-md text-secondary font-bold bg-secondary-container px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                      ) : (
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          {formatINR(data.deliveryFee)}
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Delivered by <strong className="text-on-surface">Krishi Logistics</strong> within 3–5 days
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="local_shipping" className="text-[16px] text-primary" />
                      Direct to Gram Panchayat / Village Delivery Hub
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 3: Payment Method */}
              <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/40">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[12px]">
                      3
                    </span>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">Payment Method</h2>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icon name="lock" className="text-[12px]" /> 100% Safe
                  </span>
                </div>

                <div className="flex flex-col gap-space-sm">
                  {PAYMENTS.map((p) => {
                    const selected = payment === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPayment(p.id)}
                        aria-pressed={selected}
                        className={cn(
                          "block w-full text-left p-space-md rounded-xl transition-all",
                          selected
                            ? "bg-surface-container-low ring-1 ring-primary/30"
                            : "bg-surface-container-lowest hover:bg-surface-container-low"
                        )}
                      >
                        <div className="flex items-start gap-space-sm">
                          <span
                            className={cn(
                              "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                              selected ? "border-primary" : "border-outline-variant"
                            )}
                          >
                            {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-1.5">
                                <Icon name={p.icon} className="text-[18px] text-on-surface-variant" />
                                {p.label}
                              </span>
                              {p.badge && (
                                <span
                                  className={cn(
                                    "font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold shrink-0",
                                    p.badge.className
                                  )}
                                >
                                  {p.badge.text}
                                </span>
                              )}
                              {p.right && (
                                <span className="text-primary font-label-sm text-label-sm font-semibold shrink-0">
                                  {p.right}
                                </span>
                              )}
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{p.desc}</p>
                            {p.cashback && (
                              <p className="font-body-sm text-body-sm text-secondary font-medium mt-0.5 flex items-center gap-1">
                                <Icon name="savings" className="text-[15px]" /> Instant 1% Kisan Cashback
                              </p>
                            )}
                            {p.providers && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {p.providers.map((provider) => (
                                  <span
                                    key={provider}
                                    className="px-2 py-1 bg-surface-container-lowest rounded text-on-surface font-label-sm text-label-sm font-semibold shadow-sm"
                                  >
                                    {provider}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Field label="Delivery Notes (optional)" error={undefined}>
                  <textarea
                    className={cn(inputCls(false), "h-20 py-2 resize-none")}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="e.g. Deliver after 6 pm, call before arriving"
                    maxLength={300}
                  />
                </Field>
              </section>
            </div>

            {/* Step 4: Order Summary */}
            <aside className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <h2 className="font-title-md text-title-md text-on-surface font-bold">Order Summary ({itemLabel})</h2>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">
                  {data.deliveryFee === 0 ? "Free Delivery" : `Delivery ${formatINR(data.deliveryFee)}`}
                </span>
              </div>

              <div className="flex flex-col gap-space-sm">
                {items.map((line) => (
                  <div key={line.id} className="flex items-center gap-space-sm p-2 rounded-lg bg-surface-container-low">
                    <img
                      src={line.image}
                      alt={line.name}
                      className="w-12 h-12 object-cover rounded-md bg-surface-container-lowest shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-body-sm text-body-sm text-on-surface font-semibold truncate">{line.name}</h4>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        Qty: {line.quantity}
                        {line.unit ? ` × ${line.unit}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-title-md text-title-md text-on-surface font-bold tabular">
                        {formatINR(line.lineTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-space-xs font-body-sm text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Total MRP (Original Price)</span>
                  <span className="line-through text-outline tabular">{formatINR(data.mrpTotal)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Agri Purity Direct Discount</span>
                  <span className="text-secondary font-semibold tabular">-{formatINR(data.savings)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Village Delivery Logistics</span>
                  <span
                    className={cn(
                      "font-semibold tabular",
                      data.deliveryFee === 0 ? "text-secondary" : "text-on-surface"
                    )}
                  >
                    {data.deliveryFee === 0 ? "FREE" : formatINR(data.deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 mt-2 flex justify-between items-baseline">
                  <div>
                    <span className="font-title-lg text-title-lg text-on-surface font-extrabold block">
                      Total Payable
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Includes GST &amp; e-Way Bill
                    </span>
                  </div>
                  <span className="font-price-card text-price-card text-primary font-extrabold tabular">
                    {formatINR(data.total)}
                  </span>
                </div>
              </div>

              {data.savings > 0 && (
                <div className="p-space-sm rounded-lg bg-secondary-container text-on-secondary-container flex items-center gap-2">
                  <Icon name="eco" className="text-[20px] text-secondary" />
                  <span className="font-label-md text-label-md font-bold">
                    🌾 You are saving {formatINR(data.savings)} on this farm order!
                  </span>
                </div>
              )}

              <div className="hidden md:block">
                <Button size="lg" fullWidth icon="lock" loading={checkout.isPending} onClick={submit}>
                  {checkout.isPending ? "Placing order…" : `Place Order · ${formatINR(data.total)}`}
                </Button>
              </div>
            </aside>
          </div>

          {/* Security & Trust Agricultural Badges */}
          <section className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-2.5">
            {TRUST.map((row) => (
              <div key={row.title} className="flex items-center gap-space-sm">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm shrink-0",
                    row.tint
                  )}
                >
                  <Icon name={row.icon} className="text-[18px]" />
                </div>
                <div>
                  <h4 className="font-label-md text-label-md font-bold text-on-surface">{row.title}</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{row.desc}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar (Above Global Nav) */}
      <aside className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-2xl px-margin py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-space-md">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-price-card text-price-card text-on-surface font-extrabold tabular">
                {formatINR(data.total)}
              </span>
              <span className="font-label-sm text-label-sm text-outline line-through tabular">
                {formatINR(data.mrpTotal)}
              </span>
            </div>
            {data.savings > 0 && (
              <div className="font-label-sm text-label-sm text-secondary font-bold">
                Saved {formatINR(data.savings)} Total
              </div>
            )}
          </div>
          <Button
            size="lg"
            icon="lock"
            loading={checkout.isPending}
            onClick={submit}
            className="flex-1 max-w-[210px]"
          >
            {checkout.isPending ? "Placing order…" : "Place Order"}
          </Button>
        </div>
        <div className="max-w-md mx-auto text-center mt-1">
          <span className="font-label-sm text-[10px] text-on-surface-variant">
            By placing order, you agree to KrishiBazaar Terms of Direct Agriculture Sale
          </span>
        </div>
      </aside>
    </AppShellLayout>
  );
}

function inputCls(error: boolean): string {
  return cn(
    "h-12 w-full px-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40",
    error && "ring-2 ring-error/60"
  );
}

function Field({
  label,
  error,
  children,
  className
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{label}</span>
      {children}
      {error && (
        <span className="font-label-sm text-label-sm text-error flex items-center gap-1">
          <Icon name="error" className="text-[13px]" /> {error}
        </span>
      )}
    </label>
  );
}
