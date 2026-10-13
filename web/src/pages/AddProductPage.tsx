import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCategories, useCreateProduct } from "../api/hooks";
import { ApiClientError } from "../api/client";
import type { CreateProductInput } from "../api/types";
import { SellerGate } from "../components/SellerGate";
import { AppShellLayout } from "./pageUtils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { useToast } from "../store/ToastContext";
import { formatINR } from "../lib/format";
import { cn } from "../lib/cn";

interface FormState {
  name: string;
  brand: string;
  description: string;
  longDesc: string;
  categorySlug: string;
  price: string;
  mrp: string;
  unit: string;
  packSizes: string;
  stock: string;
  image: string;
  badge: string;
  certification: string;
  mandiPrice: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  name: "",
  brand: "",
  description: "",
  longDesc: "",
  categorySlug: "",
  price: "",
  mrp: "",
  unit: "",
  packSizes: "",
  stock: "0",
  image: "",
  badge: "",
  certification: "",
  mandiPrice: ""
};

const SAMPLE_IMAGE = "https://picsum.photos/seed/agri-input/800/800";

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 3) errors.name = "Product name is too short";
  if (form.brand.trim().length < 2) errors.brand = "Brand is required";
  if (form.description.trim().length < 5) errors.description = "Add a short description";
  if (!form.categorySlug) errors.categorySlug = "Choose a category";
  const price = Number(form.price);
  const mrp = Number(form.mrp);
  if (!price || price <= 0) errors.price = "Enter a valid price";
  if (!mrp || mrp <= 0) errors.mrp = "Enter a valid MRP";
  else if (price > mrp) errors.price = "Price cannot exceed MRP";
  if (!form.unit.trim()) errors.unit = "Add a default pack size, e.g. 1 kg";
  if (!form.packSizes.trim()) errors.packSizes = "Add at least one pack size";
  if (form.stock === "" || Number(form.stock) < 0) errors.stock = "Enter stock quantity";
  if (!/^https?:\/\/.+/.test(form.image.trim())) errors.image = "Enter a valid image URL";
  return errors;
}

export default function AddProductPage() {
  return (
    <SellerGate>
      <AddProductForm />
    </SellerGate>
  );
}

function AddProductForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const categories = useCategories();
  const createProduct = useCreateProduct();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);

  const set = (key: keyof FormState, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched) setErrors(validate(next));
  };

  const submit = () => {
    setTouched(true);
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast("Please fix the highlighted fields", "error");
      return;
    }

    const payload: CreateProductInput = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      longDesc: form.longDesc.trim() || undefined,
      categorySlug: form.categorySlug,
      price: Number(form.price),
      mrp: Number(form.mrp),
      unit: form.unit.trim(),
      packSizes: form.packSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      stock: Number(form.stock),
      image: form.image.trim(),
      badge: form.badge.trim() || undefined,
      certification: form.certification.trim() || undefined,
      mandiPrice: form.mandiPrice ? Number(form.mandiPrice) : undefined
    };

    createProduct.mutate(payload, {
      onSuccess: (product) => {
        toast(`${product.name} published!`, "success");
        navigate("/seller");
      },
      onError: (err) => {
        if (err instanceof ApiClientError && err.details) {
          const mapped: Errors = {};
          for (const d of err.details) mapped[d.path as keyof FormState] = d.message;
          setErrors((prev) => ({ ...prev, ...mapped }));
        }
        toast(err.message, "error");
      }
    });
  };

  const priceNum = Number(form.price) || 0;
  const mrpNum = Number(form.mrp) || 0;
  const mandiNum = Number(form.mandiPrice) || 0;
  const savings = mrpNum > priceNum ? mrpNum - priceNum : 0;
  const discount = mrpNum > priceNum && mrpNum > 0 ? Math.round((savings / mrpNum) * 100) : 0;
  const categoryName = categories.data?.find((c) => c.slug === form.categorySlug)?.name ?? "Uncategorised";

  const checks: { label: string; detail: string; done: boolean }[] = [
    { label: "Product title provided", detail: form.name.trim() || "Add a descriptive listing name", done: form.name.trim().length >= 3 },
    { label: "Category classified", detail: categoryName, done: Boolean(form.categorySlug) },
    { label: "Pricing configured", detail: priceNum > 0 ? `${formatINR(priceNum)} vs MRP ${formatINR(mrpNum)}` : "Set selling price & MRP", done: priceNum > 0 && mrpNum > 0 },
    { label: "Primary image linked", detail: /^https?:\/\/.+/.test(form.image.trim()) ? "Buyer preview ready" : "Paste a hosted image URL", done: /^https?:\/\/.+/.test(form.image.trim()) },
    { label: "Certification attached", detail: form.certification.trim() || "Optional, but builds buyer trust", done: Boolean(form.certification.trim()) }
  ];
  const readiness = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-xl max-w-[1360px] mx-auto w-full">
        {/* Top action breadcrumb & header banner */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
          <div className="space-y-space-xs">
            <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md flex-wrap">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Icon name="dashboard" className="text-[16px]" /> Dashboard
              </Link>
              <span>/</span>
              <Link to="/seller" className="hover:text-primary transition-colors">
                My Products
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Add New Product</span>
            </nav>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface tracking-tight">
                Add Agricultural Product / Input 🌾
              </h1>
              <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-bold tracking-wider">
                ICAR Level-3 Compliant
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              List certified seeds, fertilizers, crop protection, or fresh harvest produce across Western Maharashtra farmer
              networks &amp; direct agricultural buyers.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              type="button"
              onClick={() => navigate("/seller")}
              className="h-12 px-space-lg rounded-xl bg-surface-container-high text-on-surface font-title-md text-title-md hover:bg-surface-variant transition-colors flex items-center gap-space-xs"
            >
              <Icon name="close" className="text-[18px]" /> Discard
            </button>
            <Button size="lg" icon="rocket_launch" loading={createProduct.isPending} onClick={submit}>
              {createProduct.isPending ? "Publishing…" : "Publish Product"}
            </Button>
          </div>
        </div>

        {/* Main grid workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Primary form canvas */}
          <div className="lg:col-span-8 space-y-space-xl">
            {/* SECTION 1: Basic information & taxonomy */}
            <Section
              icon="info"
              title="1. Basic Information & Taxonomy"
              subtitle="Core listing identification and agri-category classification"
              badge="Step 1 of 5"
            >
              <div className="space-y-space-md">
                <Field
                  label="Product Title / Listing Name"
                  required
                  error={touched ? errors.name : undefined}
                  hint="Include crop type, variety code, and core trait (e.g., Wilt Tolerant, High Yield) for optimal search discovery."
                >
                  <input
                    className={inputCls(touched && !!errors.name)}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Mahyco Hybrid Chilli Seeds Tejas-4"
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <Field label="Category & Agri Classification" required error={touched ? errors.categorySlug : undefined}>
                    <div className="relative">
                      <select
                        className={selectCls(touched && !!errors.categorySlug)}
                        value={form.categorySlug}
                        onChange={(e) => set("categorySlug", e.target.value)}
                      >
                        <option value="">Select category…</option>
                        {categories.data?.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
                    </div>
                  </Field>
                  <Field label="Brand / Producer Entity" required error={touched ? errors.brand : undefined}>
                    <input
                      className={inputCls(touched && !!errors.brand)}
                      value={form.brand}
                      onChange={(e) => set("brand", e.target.value)}
                      placeholder="Namdhari Seeds Pvt. Ltd."
                    />
                  </Field>
                </div>
                <Field label="Short Description" required error={touched ? errors.description : undefined}>
                  <input
                    className={inputCls(touched && !!errors.description)}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="One line shown on the product card"
                    maxLength={120}
                  />
                </Field>
                <Field label="Product Agronomy Summary & Description">
                  <textarea
                    className={cn(inputCls(false), "h-28 py-3 resize-y")}
                    value={form.longDesc}
                    onChange={(e) => set("longDesc", e.target.value)}
                    placeholder="Detail germination specifications, soil suitability, disease tolerance, and harvest guidelines…"
                  />
                </Field>
              </div>
            </Section>

            {/* SECTION 2: Media & visual verification */}
            <Section
              icon="photo_library"
              title="2. Media & Visual Verification"
              subtitle="High-resolution packaging photos and certification imagery"
              badge={
                <span className="font-label-sm text-label-sm text-secondary bg-surface-container-low px-space-sm py-1 rounded-full flex items-center gap-1 font-semibold">
                  <Icon name="verified" className="text-[14px]" /> Recommended
                </span>
              }
            >
              <Field label="Image URL" required error={touched ? errors.image : undefined} hint="Paste a hosted image URL (PNG, JPG, WebP).">
                <input
                  className={inputCls(touched && !!errors.image)}
                  value={form.image}
                  onChange={(e) => set("image", e.target.value)}
                  placeholder="https://…"
                />
              </Field>

              <button
                type="button"
                onClick={() => set("image", SAMPLE_IMAGE)}
                className="w-full p-space-lg rounded-2xl bg-surface-container-low flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform mb-space-sm">
                  <Icon name="cloud_upload" className="text-[30px]" />
                </div>
                <p className="font-title-md text-title-md text-on-surface">
                  Click to <span className="text-primary underline">use a sample image</span>
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Supports PNG, JPG, WebP up to 10MB each</p>
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
                {form.image && (
                  <div className="relative group rounded-xl overflow-hidden bg-surface-container-high aspect-square shadow-sm">
                    <img
                      src={form.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0.2")}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase font-bold tracking-wider shadow">
                      Primary Pack
                    </span>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => set("image", "")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface/90 text-error flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow"
                    >
                      <Icon name="delete" className="text-[16px]" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => set("image", SAMPLE_IMAGE)}
                  className="rounded-xl bg-surface-container-low hover:bg-surface-container aspect-square flex flex-col items-center justify-center gap-space-xs text-on-surface-variant hover:text-primary transition-all"
                >
                  <Icon name="add_photo_alternate" className="text-[28px]" />
                  <span className="font-label-md text-label-md font-semibold">+ Add Media</span>
                </button>
              </div>
            </Section>

            {/* SECTION 3: Quality & compliance marks */}
            <Section
              icon="science"
              title="3. Agronomic Specifications & Quality Parameters"
              subtitle="Certification marks and badges displayed on the buyer listing"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <Field label="Listing Badge (optional)" error={undefined}>
                  <input
                    className={inputCls(false)}
                    value={form.badge}
                    onChange={(e) => set("badge", e.target.value)}
                    placeholder="e.g. ICAR Certified / High Yield"
                  />
                </Field>
                <Field label="Certification / Licence (optional)" error={undefined}>
                  <input
                    className={inputCls(false)}
                    value={form.certification}
                    onChange={(e) => set("certification", e.target.value)}
                    placeholder="e.g. GEAC Approved, MH-AG-SEED-8942"
                  />
                </Field>
              </div>
            </Section>

            {/* SECTION 4: Pricing & mandi benchmarking */}
            <Section
              icon="currency_rupee"
              title="4. Transparent Pricing & Mandi Benchmarking"
              subtitle="Clear price breakdowns and mandi reference comparison"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <Field label="Kisan Direct Selling Price (₹)" required error={touched ? errors.price : undefined}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-title-md text-title-md font-bold pointer-events-none">
                      ₹
                    </span>
                    <input
                      className={cn(inputCls(touched && !!errors.price), "pl-8")}
                      value={form.price}
                      onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="340"
                    />
                  </div>
                </Field>
                <Field label="Maximum Retail Price (MRP ₹)" required error={touched ? errors.mrp : undefined}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-title-md text-title-md pointer-events-none">
                      ₹
                    </span>
                    <input
                      className={cn(inputCls(touched && !!errors.mrp), "pl-8")}
                      value={form.mrp}
                      onChange={(e) => set("mrp", e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="450"
                    />
                  </div>
                </Field>
                <Field label="Mandi Price (₹, optional)" error={undefined}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-title-md text-title-md pointer-events-none">
                      ₹
                    </span>
                    <input
                      className={cn(inputCls(false), "pl-8")}
                      value={form.mandiPrice}
                      onChange={(e) => set("mandiPrice", e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="410"
                    />
                  </div>
                </Field>
              </div>

              {/* Mandi live comparison micro-bar */}
              <div className="p-space-md rounded-xl bg-surface-container-low space-y-space-xs">
                <div className="flex items-center justify-between gap-space-sm flex-wrap text-on-surface">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" />
                    <span className="font-title-md text-title-md">Mandi Benchmark Comparison</span>
                  </div>
                  {discount > 0 && (
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold">
                      Farmer Saves {formatINR(savings)} ({discount}% OFF MRP)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-space-sm text-body-sm text-on-surface-variant flex-wrap">
                  {mandiNum > 0 && (
                    <>
                      <span>
                        Mandi reference: <strong className="text-on-surface">{formatINR(mandiNum)}</strong>
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span className="text-secondary font-medium">
                    Direct pricing keeps farm-gate rates below local ag-dealers.
                  </span>
                </div>
                {discount > 0 && (
                  <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden flex mt-2">
                    <div className="h-full bg-primary" style={{ width: `${100 - discount}%` }} />
                    <div className="h-full bg-tertiary-fixed-dim" style={{ width: `${discount}%` }} />
                  </div>
                )}
              </div>
            </Section>

            {/* SECTION 5: Inventory & packaging */}
            <Section
              icon="inventory_2"
              title="5. Inventory, Lot Number & Packaging Specs"
              subtitle="Stock control and pack-size variants synced to your catalogue"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
                <Field label="Stock Available for Immediate Sale" required error={touched ? errors.stock : undefined}>
                  <input
                    className={inputCls(touched && !!errors.stock)}
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder="120"
                  />
                </Field>
                <Field label="Default Pack Size (UOM)" required error={touched ? errors.unit : undefined}>
                  <input
                    className={inputCls(touched && !!errors.unit)}
                    value={form.unit}
                    onChange={(e) => set("unit", e.target.value)}
                    placeholder="1 kg Pouch"
                  />
                </Field>
                <Field label="Pack Sizes (comma separated)" required error={touched ? errors.packSizes : undefined}>
                  <input
                    className={inputCls(touched && !!errors.packSizes)}
                    value={form.packSizes}
                    onChange={(e) => set("packSizes", e.target.value)}
                    placeholder="10 g, 50 g, 250 g"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Right column: live buyer preview & checklist */}
          <aside className="lg:col-span-4 space-y-space-lg lg:sticky lg:top-20">
            {/* Buyer view preview */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-md">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-space-xs text-primary">
                  <Icon name="visibility" className="text-[18px]" />
                  <span className="font-label-md text-label-md uppercase tracking-wider font-bold">Buyer View Preview</span>
                </div>
                <span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-0.5 rounded text-on-surface-variant">Live Sync</span>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-space-md space-y-space-sm shadow-sm">
                <div className="relative rounded-xl overflow-hidden bg-surface-container-lowest aspect-[4/3]">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0.2")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="image" className="text-[40px] text-outline" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {discount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold shadow-sm">
                        {discount}% OFF
                      </span>
                    )}
                    {(form.certification.trim() || form.badge.trim()) && (
                      <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold flex items-center gap-0.5 shadow-sm">
                        <Icon name="verified" className="text-[12px]" filled /> {form.certification.trim() || form.badge.trim()}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface/90 text-on-surface font-label-sm text-label-sm font-medium shadow-sm">
                    In Stock: <span className="font-bold text-primary">{form.stock || 0} units</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mb-1">
                    <span>{form.brand || "Brand"}</span>
                    <span>•</span>
                    <span className="text-secondary font-medium">{categoryName}</span>
                  </div>
                  <h3 className="font-title-md text-title-md text-on-surface line-clamp-2 leading-snug">
                    {form.name || "Untitled Agricultural Product"}
                  </h3>
                </div>

                <div className="flex items-baseline gap-space-sm pt-1 flex-wrap">
                  <span className="font-price-card text-price-card text-primary font-bold tabular">{formatINR(priceNum)}</span>
                  <span className="font-body-md text-body-md text-outline line-through tabular">{formatINR(mrpNum)}</span>
                  {savings > 0 && <span className="font-label-sm text-label-sm text-secondary font-bold">{formatINR(savings)} Saved</span>}
                </div>
                <div className="text-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                  <Icon name="local_shipping" className="text-[14px] text-secondary" />
                  <span>{form.unit || "Pack size"} · Express dispatch available</span>
                </div>
                <div className="w-full h-10 rounded-xl bg-primary text-on-primary font-title-md text-title-md flex items-center justify-center gap-2 shadow-sm mt-space-xs">
                  <Icon name="shopping_cart" className="text-[18px]" /> Add to Kisan Cart
                </div>
              </div>
            </div>

            {/* Compliance & regulatory checklist */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <h4 className="font-title-md text-title-md text-on-surface flex items-center gap-1.5">
                  <Icon name="gavel" className="text-secondary text-[20px]" /> Listing Readiness
                </h4>
                <span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                  {readiness}% Ready
                </span>
              </div>
              <div className="space-y-space-sm font-body-sm text-body-sm">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-low transition-colors">
                    <Icon
                      name={c.done ? "check_circle" : "radio_button_unchecked"}
                      className={cn("text-[18px] shrink-0 mt-0.5", c.done ? "text-secondary" : "text-outline")}
                    />
                    <div>
                      <span className={cn("font-medium", c.done ? "text-on-surface" : "text-on-surface-variant")}>{c.label}</span>
                      <p className="text-on-surface-variant font-label-sm text-label-sm">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandi price advisory widget */}
            <div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm space-y-space-xs">
              <div className="flex items-center gap-space-xs text-primary">
                <Icon name="query_stats" className="text-[20px]" />
                <span className="font-title-md text-title-md font-bold">Mandi Pricing Advisory</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Setting direct prices <strong>10% - 15% below traditional retail dealers</strong> increases buyer transaction volume
                across FPO members.
              </p>
              <div className="pt-2 flex items-center justify-between text-label-sm text-label-sm text-on-surface font-semibold">
                <span>Reference benchmark</span>
                <span className="text-primary font-bold">{mandiNum > 0 ? `${formatINR(mandiNum)}/pack` : "Not set"}</span>
              </div>
            </div>

            {/* Final action bar */}
            <div className="p-space-md bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col gap-space-sm">
              <Button size="lg" fullWidth icon="rocket_launch" loading={createProduct.isPending} onClick={submit}>
                {createProduct.isPending ? "Publishing…" : "Publish to KrishiBazaar"}
              </Button>
              <button
                type="button"
                onClick={() => navigate("/seller")}
                className="w-full h-10 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors"
              >
                Discard &amp; Return
              </button>
              <p className="font-label-sm text-label-sm text-outline flex items-center gap-1 justify-center">
                <Icon name="info" className="text-[14px]" /> Visible to buyers immediately after publishing.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AppShellLayout>
  );
}

function Section({
  icon,
  title,
  subtitle,
  badge,
  children
}: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-xl shadow-sm space-y-space-lg">
      <div className="flex items-center justify-between gap-space-sm pb-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <Icon name={icon} className="text-[20px]" />
          </div>
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">{title}</h2>
            {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
          </div>
        </div>
        {badge &&
          (typeof badge === "string" ? (
            <span className="font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded text-on-surface-variant font-medium shrink-0">
              {badge}
            </span>
          ) : (
            badge
          ))}
      </div>
      {children}
    </section>
  );
}

function inputCls(error: boolean): string {
  return cn(
    "w-full h-12 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-outline-variant",
    error ? "ring-1 ring-error" : ""
  );
}

function selectCls(error: boolean): string {
  return cn(inputCls(error), "appearance-none cursor-pointer pr-10");
}

function Field({
  label,
  error,
  required,
  hint,
  children,
  className
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col", className)}>
      <span className="block font-label-md text-label-md text-on-surface mb-1.5">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
          <Icon name="tips_and_updates" className="text-[14px] text-secondary" /> {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 font-body-sm text-body-sm text-error flex items-center gap-1">
          <Icon name="error" className="text-[14px]" /> {error}
        </span>
      )}
    </label>
  );
}
