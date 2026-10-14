import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAddresses, useCart, useOrders } from "../api/hooks";
import { AppShellLayout } from "./pageUtils";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { EmptyState, ErrorState } from "../components/States";
import { useSession } from "../store/SessionContext";
import { useToast } from "../store/ToastContext";
import { fileToAvatarDataUrl } from "../lib/image";
import { formatINR, formatDate, classForOrderStatus } from "../lib/format";
import { cn } from "../lib/cn";

const WISHLIST_KEY = "kb_wishlist";

function wishlistCount(): number {
  try {
    return (JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]") as string[]).length;
  } catch {
    return 0;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, ready, isGuest, signInAs, signInAsGuest, signOut, updateProfile } = useSession();
  const orders = useOrders();
  const addresses = useAddresses();
  const cart = useCart();
  const { toast } = useToast();

  const saved = useMemo(wishlistCount, []);

  const fileRef = useRef<HTMLInputElement>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const onPickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setPhotoError(null);
    setSavingPhoto(true);
    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      await updateProfile({ avatarUrl });
      toast("Profile photo updated", "success");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not update the photo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const removePhoto = async () => {
    setPhotoError(null);
    setSavingPhoto(true);
    try {
      await updateProfile({ avatarUrl: null });
      toast("Profile photo removed", "info");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not remove the photo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  if (!ready) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-3">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      </AppShellLayout>
    );
  }

  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-lg max-w-3xl mx-auto w-full">
        {/* Profile header with profile photo */}
        <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar
              src={user?.avatarUrl}
              name={user?.name}
              role={user?.role}
              size={80}
              className="ring-4 ring-primary-fixed/70"
            />
            {!isGuest && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={savingPhoto}
                aria-label="Change profile photo"
                className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md ring-2 ring-surface-container-lowest active:scale-95 transition-transform disabled:opacity-60"
              >
                <Icon
                  name={savingPhoto ? "progress_activity" : "photo_camera"}
                  filled
                  className={cn("text-[17px]", savingPhoto && "animate-spin")}
                />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                {user?.name ?? "Guest Kisan"}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">
                <Icon name="verified" filled className="text-[13px]" />
                {user?.role === "SELLER" ? "Agri Dealer" : "Kisan Verified"}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-outline mt-0.5">
              {user?.shopName ?? user?.phone ?? "—"}
            </p>

            {isGuest ? (
              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold hover:underline"
              >
                <Icon name="photo_camera" className="text-[15px]" /> Sign in to add a profile photo
              </Link>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="font-label-md text-label-md text-primary font-semibold hover:underline"
                >
                  {user?.avatarUrl ? "Change photo" : "Add photo"}
                </button>
                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => void removePhoto()}
                    disabled={savingPhoto}
                    className="font-label-md text-label-md text-error font-semibold hover:underline disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}

            {photoError && (
              <p role="alert" className="font-body-sm text-body-sm text-error mt-1.5">
                {photoError}
              </p>
            )}
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-3 gap-2.5">
          {[
            { icon: "receipt_long", label: "Orders", value: String(orders.data?.length ?? 0) },
            { icon: "favorite", label: "Wishlist", value: String(saved) },
            { icon: "shopping_cart", label: "In Cart", value: String(cart.data?.itemCount ?? 0) }
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => s.label === "In Cart" && navigate("/cart")}
              className="rounded-xl bg-surface-container-lowest p-3 shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-level2 transition-shadow"
            >
              <Icon name={s.icon} className="text-[22px] text-primary" filled />
              <span className="font-title-md text-title-md font-bold text-on-surface tabular">{s.value}</span>
              <span className="font-label-sm text-label-sm text-outline">{s.label}</span>
            </button>
          ))}
        </section>

        {/* Demo account switcher */}
        <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex items-center gap-2">
            <Icon name="swap_horiz" className="text-primary text-[20px]" />
            <h2 className="font-title-lg text-title-lg font-bold">Demo Accounts</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => void signInAsGuest("CUSTOMER")}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors",
                user?.role === "CUSTOMER" ? "border-primary bg-primary-fixed/40" : "border-outline-variant hover:border-primary/60"
              )}
            >
              <span className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <Icon name="agriculture" className="text-[20px]" />
              </span>
              <span className="flex flex-col">
                <span className="font-title-md text-title-md font-bold">Buyer</span>
                <span className="font-body-sm text-body-sm text-outline">Phone 9000000000</span>
              </span>
            </button>
            <button
              onClick={() => void signInAs("SELLER")}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors",
                user?.role === "SELLER" ? "border-primary bg-primary-fixed/40" : "border-outline-variant hover:border-primary/60"
              )}
            >
              <span className="w-9 h-9 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <Icon name="storefront" className="text-[20px]" />
              </span>
              <span className="flex flex-col">
                <span className="font-title-md text-title-md font-bold">Seller</span>
                <span className="font-body-sm text-body-sm text-outline">Phone 9800000001</span>
              </span>
            </button>
          </div>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-outline-variant/60 font-title-md text-title-md font-semibold text-primary hover:bg-primary-fixed/20 transition-colors"
          >
            <Icon name="phone_android" className="text-[18px]" /> Sign in with mobile number
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/seller" className="flex-1">
              <Button fullWidth variant="secondary" icon="storefront">Open Seller Hub</Button>
            </Link>
            <Button variant="ghost" icon="logout" onClick={signOut}>Reset</Button>
          </div>
        </section>

        {/* Orders */}
        <section className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-space-lg border-b border-outline-variant/40">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-1.5">
              <Icon name="receipt_long" className="text-primary text-[20px]" filled /> My Orders
            </h2>
          </div>

          {orders.isLoading && (
            <div className="p-space-lg flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}

          {orders.isError && <ErrorState title="Couldn’t load orders" description={orders.error.message} onAction={() => orders.refetch()} />}

          {orders.isSuccess && orders.data.length === 0 && (
            <EmptyState
              icon="shopping_bag"
              title="No orders yet"
              description="Your past orders will appear here."
              actionLabel="Start Shopping"
              onAction={() => navigate("/products")}
            />
          )}

          {orders.isSuccess && orders.data.length > 0 && (
            <ul className="divide-y divide-outline-variant/30">
              {orders.data.map((o) => (
                <li key={o.id}>
                  <Link to={`/order/${o.orderNumber}`} className="flex items-center gap-3 p-3 hover:bg-surface-container-low transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                      <Icon name="shopping_bag" className="text-[20px] text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-title-md text-[14px] font-semibold text-on-surface">{o.orderNumber}</p>
                      <p className="font-body-sm text-body-sm text-outline">
                        {formatDate(o.createdAt)} · {o.itemCount} item(s)
                      </p>
                    </div>
                    <span className={cn("hidden sm:inline-flex px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold", classForOrderStatus(o.status))}>
                      {o.status}
                    </span>
                    <span className="font-label-md text-label-md font-bold tabular">{formatINR(o.total)}</span>
                    <Icon name="chevron_right" className="text-outline" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Addresses */}
        {addresses.isSuccess && addresses.data.length > 0 && (
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
            <div className="p-space-lg border-b border-outline-variant/40">
              <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-1.5">
                <Icon name="location_on" className="text-primary text-[20px]" filled /> Saved Addresses
              </h2>
            </div>
            <ul className="divide-y divide-outline-variant/30">
              {addresses.data.map((a) => (
                <li key={a.id} className="p-3 flex items-start gap-3">
                  <span className="mt-0.5 px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm font-bold text-on-surface-variant">
                    {a.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-on-surface">{a.name}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {a.line}, {a.city}, {a.state} — {a.pincode}
                    </p>
                    <p className="font-label-sm text-label-sm text-outline">{a.phone}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Support */}
        <section className="rounded-2xl bg-primary text-on-primary p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-on-primary/10 flex items-center justify-center">
              <Icon name="support_agent" className="text-[22px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-primary-fixed font-bold">Kisan Call Helpline</span>
              <span className="font-title-md text-title-md font-extrabold tracking-wide">1800-266-9999</span>
            </div>
          </div>
          <a href="tel:18002669999" className="h-9 px-3.5 bg-surface-container-lowest text-primary rounded-xl font-title-md text-[13px] font-bold flex items-center">
            Call
          </a>
        </section>
      </div>
    </AppShellLayout>
  );
}
