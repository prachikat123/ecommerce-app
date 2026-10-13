import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../api/types";
import { useAddToCart } from "../api/hooks";
import { useToast } from "../store/ToastContext";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { DiscountBadge, InfoPill, TrustBadge } from "./Badges";
import { StarRating } from "./StarRating";
import { PriceCluster } from "./PriceCluster";
import { MandiBar } from "./MandiBar";

const WISHLIST_KEY = "kb_wishlist";

function readWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function FavoriteButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(() => readWishlist().includes(productId));
  const { toast } = useToast();

  useEffect(() => {
    setSaved(readWishlist().includes(productId));
  }, [productId]);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const list = readWishlist();
      const next = list.includes(productId) ? list.filter((id) => id !== productId) : [...list, productId];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      setSaved(next.includes(productId));
      toast(next.includes(productId) ? "Saved to wishlist" : "Removed from wishlist", "info");
    },
    [productId, toast]
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className={cn(
        "z-10 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform",
        saved ? "text-error" : "text-outline hover:text-error"
      )}
    >
      <Icon name="favorite" filled={saved} className="text-[18px]" />
    </button>
  );
}

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "deal";
}

/**
 * Product tile — matches the KrishiBazaar design: badges zone, framed image,
 * brand/name, pack + stock row, rating, price cluster, mandi bar, add CTA.
 */
export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart.mutate(
      { productId: product.id, quantity: 1, unit: product.packSizes[0] ?? product.unit },
      {
        onSuccess: () => {
          toast(`${product.name} added to cart`, "success");
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 1400);
        },
        onError: (err) => toast(err.message, "error")
      }
    );
  };

  const isDeal = variant === "deal";

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn(
        "group rounded-2xl bg-surface-container-lowest p-space-sm flex flex-col shadow-sm border border-transparent hover:border-primary-fixed hover:shadow-level2 transition-all relative",
        isDeal && "w-64 shrink-0"
      )}
    >
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <DiscountBadge percent={product.discountPercent} size={isDeal ? "md" : "sm"} />
        {product.badge && <TrustBadge label={product.badge} icon="verified" size={isDeal ? "md" : "sm"} />}
      </div>
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton productId={product.id} />
      </div>

      <div
        className={cn(
          "w-full rounded-xl bg-surface-container-low overflow-hidden flex items-center justify-center",
          isDeal ? "h-36" : "h-32"
        )}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0";
          }}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-sm text-[10px] text-primary font-bold uppercase tracking-wider truncate">
            {product.brand}
          </span>
          <InfoPill label={product.packSizes[0] ?? product.unit} />
        </div>

        <h3 className="font-title-md text-title-md text-on-surface font-bold mt-1 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-0.5">
          <span className="font-body-sm text-[12px] text-outline line-clamp-2">{product.description}</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <StarRating rating={product.rating} count={product.ratingCount} />
          <span className={cn("font-body-sm text-[11px] font-semibold", product.inStock ? "text-secondary" : "text-error")}>
            {product.inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        <PriceCluster
          price={product.price}
          mrp={product.mrp}
          discountPercent={product.discountPercent}
          className="mt-1.5"
        />

        {product.mandiPrice !== undefined && product.mandiSavings !== undefined && (
          <MandiBar mandiPrice={product.mandiPrice} price={product.price} savings={product.mandiSavings} />
        )}

        <Button
          variant={variant === "deal" ? "primary" : "soft"}
          size="md"
          fullWidth
          className="mt-2.5"
          icon={justAdded ? "check" : "shopping_cart"}
          loading={addToCart.isPending}
          disabled={!product.inStock}
          onClick={handleAdd}
        >
          {justAdded ? "Added!" : "Add to Cart"}
        </Button>
      </div>
    </Link>
  );
}
