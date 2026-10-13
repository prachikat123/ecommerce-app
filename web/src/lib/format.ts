/** Indian Rupee formatting with the Indian grouping system (₹1,25,000). */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "₹0";
  return inr.format(value);
}

/** Compact count formatting, e.g. 1240 -> "1,240". */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function classForOrderStatus(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-secondary-container/50 text-on-secondary-container";
    case "SHIPPED":
      return "bg-surface-container-high text-primary";
    case "PACKED":
      return "bg-tertiary-fixed text-on-tertiary-fixed";
    case "CANCELLED":
      return "bg-error-container text-on-error-container";
    default:
      return "bg-primary-fixed text-on-primary-fixed";
  }
}
