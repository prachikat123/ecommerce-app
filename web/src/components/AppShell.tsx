import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCart } from "../api/hooks";
import { useSession } from "../store/SessionContext";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

function CartCountBadge() {
  const { data } = useCart();
  const count = data?.itemCount ?? 0;
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[15px] h-[15px] rounded-full bg-primary-container text-on-primary-container font-label-sm text-[9px] flex items-center justify-center font-bold tabular">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const bottomNav = [
  { to: "/", icon: "home", label: "Home", end: true },
  { to: "/products", icon: "category", label: "Categories", end: false },
  { to: "/products?focus=search", icon: "search", label: "Search", end: false },
  { to: "/cart", icon: "shopping_cart", label: "Cart", end: false, cart: true },
  { to: "/profile", icon: "person", label: "Profile", end: false }
];

export function AppShell() {
  const { user, isGuest } = useSession();
  const location = useLocation();

  return (
    <div className="min-h-full flex flex-col">
      {/* ───────────── Desktop / tablet header ───────────── */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40">
        <div className="mx-auto max-w-container px-margin md:px-margin-desktop h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center">
              <Icon name="eco" filled className="text-[22px]" />
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-headline-sm text-headline-sm font-extrabold text-primary">KrishiBazaar</span>
              <span className="font-label-sm text-[9px] text-outline font-semibold tracking-wider uppercase">
                AgriMarket India
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <TopLink to="/" label="Home" />
            <TopLink to="/products" label="Shop" />
            <TopLink to="/profile" label="My Farm" />
            <TopLink to="/seller" label="Seller Hub" />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
              <Icon name="pin_drop" className="text-[16px] text-primary" filled />
              Nashik, Maharashtra — 422003
            </span>
            {user && (
              <>
                <Link
                  to="/profile"
                  aria-label="Your profile"
                  className="hidden sm:inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold hover:brightness-105 transition"
                >
                  <Avatar src={user.avatarUrl} name={user.name} role={user.role} size={26} />
                  {user.role === "SELLER" ? user.shopName ?? "Seller" : "Kisan Verified"}
                </Link>
                <Link to="/profile" aria-label="Your profile" className="sm:hidden">
                  <Avatar
                    src={user.avatarUrl}
                    name={user.name}
                    role={user.role}
                    size={34}
                    className="ring-2 ring-primary-fixed/70"
                  />
                </Link>
              </>
            )}
            {isGuest && (
              <>
                <Link
                  to="/login"
                  aria-label="Sign in"
                  className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-outline-variant/60 text-primary font-title-md text-[13px] font-semibold hover:bg-primary-fixed/20 transition-colors"
                >
                  <Icon name="login" className="text-[18px]" /> Sign in
                </Link>
                <Link
                  to="/login"
                  aria-label="Sign in"
                  className="sm:hidden w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="login" className="text-[22px]" />
                </Link>
              </>
            )}
            <Link
              to="/cart"
              aria-label="Cart"
              className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors",
                location.pathname === "/cart" && "bg-surface-container-high text-primary"
              )}
            >
              <Icon name="shopping_cart" className="text-[22px]" />
              <CartCountBadge />
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────── Page content ───────────── */}
      <main className="flex-1 w-full mx-auto max-w-container pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* ───────────── Mobile bottom navigation ───────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          {bottomNav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive && !item.to.includes("?") ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary"
                )
              }
            >
              <span className="relative flex items-center justify-center">
                <Icon name={item.icon} className="text-[22px]" />
                {item.cart && <CartCountBadge />}
              </span>
              <span className="font-label-sm text-label-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ───────────── Desktop footer trust bar ───────────── */}
      <footer className="hidden md:block border-t border-outline-variant/40 mt-8">
        <div className="mx-auto max-w-container px-margin-desktop py-6 flex items-center justify-between text-on-surface-variant">
          <p className="font-body-sm text-body-sm">
            © {new Date().getFullYear()} KrishiBazaar · AgriMarket India Platform
          </p>
          <div className="flex items-center gap-4 font-label-md text-label-md">
            <span className="flex items-center gap-1">
              <Icon name="verified" className="text-[16px] text-primary" /> 100% Genuine Agri-Inputs
            </span>
            <span className="flex items-center gap-1">
              <Icon name="local_shipping" className="text-[16px] text-primary" /> 19,000+ Pincodes
            </span>
            <span className="flex items-center gap-1">
              <Icon name="support_agent" className="text-[16px] text-primary" /> 1800-266-9999
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "px-3 py-2 rounded-xl font-title-md text-title-md transition-colors",
          isActive ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container-high"
        )
      }
    >
      {label}
    </NavLink>
  );
}
