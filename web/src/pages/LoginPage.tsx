import { Link, useLocation, useNavigate } from "react-router-dom";
import { AccountRoleSelector } from "../components/AccountRoleSelector";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { OtpInput } from "../components/OtpInput";
import { TrustAssuranceRow } from "../components/TrustAssuranceRow";
import { useLoginFlow, type LoginRole } from "../hooks/useLoginFlow";
import { useSession } from "../store/SessionContext";
import { useToast } from "../store/ToastContext";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB3V23FUo7scyZkT3l4oTKl0RpY9PAmcz_I6brqaSSsI41cX5AikznyFmGfxP4k3OuWDHKhYaumsRgHw1WaVVixVuWguNamCCPTgw2vAZtOXhvySc2L8vL_AMkDLaNAcofEp2503opbxkKV3OXkDkp2nqlHCOyVrGOriD5PkQKfPsABQFeBy9gt2pr2aVPqXlnIfOqW5RkyLerUudTtiOlI-mioQYrOxz1R_PgTmg";

const formatPhone = (value: string) => value.replace(/(\d{5})(\d{1,5})/, "$1 $2");

interface LoginLocationState {
  readonly from?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signInAs, signInAsGuest } = useSession();
  const flow = useLoginFlow();
  const redirectedFrom = (location.state as LoginLocationState | null)?.from;
  // A plain sign-in lands on the profile page; gated actions return to where
  // the visitor was blocked.
  const from = redirectedFrom ?? "/profile";

  const handleVerify = async () => {
    const user = await flow.verify();
    if (!user) return;
    toast(`Welcome back, ${user.name}`, "success");
    navigate(user.role === "SELLER" ? "/seller" : from, { replace: true });
  };

  const handleDemo = async (role: LoginRole) => {
    // The dealer portal is a real sign-in; "guest buyer" stays a guest so
    // gated actions (wishlist / selling) still ask for a mobile number.
    if (role === "SELLER") await signInAs("SELLER");
    else await signInAsGuest("CUSTOMER");
    toast(role === "SELLER" ? "Signed in as demo dealer" : "Continuing as guest buyer", "success");
    // The dealer portal opens the hub; guest browsing returns to the storefront.
    navigate(role === "SELLER" ? "/seller" : redirectedFrom ?? "/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-surface flex justify-center sm:py-space-lg">
      <main className="w-full max-w-[390px] bg-surface-container-lowest min-h-screen shadow-2xl flex flex-col pb-10">
        {/* 1. Top brand bar */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
              <Icon name="agriculture" filled className="text-[22px]" />
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight block leading-none">
                KrishiBazaar
              </span>
              <span className="text-[9px] font-label-md text-outline tracking-wider uppercase block mt-0.5">
                AgriStack Verified
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-colors text-label-md font-label-md active:scale-95"
            >
              <span className="text-primary font-bold">EN</span>
              <span className="text-outline">/</span>
              <span className="text-on-surface-variant font-medium">हिंदी</span>
            </button>
            <Link
              to="/"
              aria-label="Back to store"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="close" className="text-[20px]" />
            </Link>
          </div>
        </header>

        {/* Sub-header verification ribbon */}
        <div className="bg-surface-container-high/60 px-4 py-1.5 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-1.5 text-on-secondary-fixed-variant">
            <Icon name="verified" filled className="text-[14px]" />
            <span className="font-label-md text-label-md">Direct Govt Subsidy Link Active</span>
          </div>
          <a href="tel:18004195747" className="text-[11px] font-label-md text-tertiary-container font-semibold">
            Toll-Free 1800-419-KRISHI
          </a>
        </div>

        <div className="px-4 pt-3.5 space-y-4 flex-1">
          {redirectedFrom && redirectedFrom !== "/" && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl bg-primary-container/20 text-on-primary-container px-3 py-2.5 border border-primary/20"
            >
              <Icon name="lock" filled className="text-[18px] shrink-0 text-primary" />
              <span className="font-body-sm text-body-sm font-medium">
                Sign in to continue — saving to your wishlist and selling need a verified account.
              </span>
            </div>
          )}

          {/* 2. Welcome hero */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 bg-surface">
            <div className="relative h-44 w-full overflow-hidden">
              <img
                alt="Smiling Indian farmer standing in a lush green field under warm morning sunlight"
                src={HERO_IMAGE}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3.5 text-white">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/90 text-on-secondary-fixed text-label-sm font-label-sm w-fit mb-1.5 shadow-sm">
                  <Icon name="spa" filled className="text-[13px]" />
                  100% Genuine Certified Inputs
                </span>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-white leading-tight">
                  Welcome back, Kisan
                  <span className="text-primary-fixed block font-headline-sm text-headline-sm font-semibold">
                    नमस्ते किसान
                  </span>
                </h1>
                <p className="font-body-sm text-body-sm text-gray-200 mt-0.5 line-clamp-1">
                  Seeds, fertilisers &amp; tools delivered straight to your village.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Account role selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Select Account Type
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-0.5">
                <Icon name="lock" className="text-[12px]" /> One-Click Switch
              </span>
            </div>
            <AccountRoleSelector
              value={flow.role}
              onChange={flow.setRole}
              disabled={flow.step === "OTP" || flow.submitting}
            />
          </div>

          {flow.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-error-container text-on-error-container px-3 py-2.5"
            >
              <Icon name="error" filled className="text-[18px] shrink-0" />
              <span className="font-body-sm text-body-sm font-medium">{flow.error}</span>
            </div>
          )}

          {/* 4. Phone login form */}
          {flow.step === "PHONE" && (
            <section className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="mobile-phone"
                  className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1.5"
                >
                  <Icon name="phone_android" className="text-primary text-[18px]" />
                  Mobile Number
                </label>
                <span className="font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
                  No Password Needed
                </span>
              </div>

              <div className="flex items-center h-12 w-full rounded-xl bg-surface-container-lowest border border-outline focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all px-3">
                <span className="flex items-center gap-1.5 pr-2.5 border-r border-outline-variant/50">
                  <span className="text-base select-none leading-none">🇮🇳</span>
                  <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">+91</span>
                </span>
                <input
                  id="mobile-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={flow.phone}
                  onChange={(event) => flow.setPhone(event.target.value)}
                  placeholder="Enter 10-digit number"
                  className="flex-1 pl-3 bg-transparent border-0 focus:ring-0 font-headline-sm text-headline-sm text-on-surface placeholder:text-outline/60 tracking-wider"
                />
                {flow.phoneValid && <Icon name="check_circle" filled className="text-primary text-[20px]" />}
              </div>

              <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
                <span className="flex items-center gap-1">
                  <Icon name="chat" className="text-[13px] text-primary" />
                  OTP via WhatsApp
                </span>
                <span className="font-medium text-primary">Instant Delivery</span>
              </div>

              <Button fullWidth size="lg" onClick={flow.requestOtp} disabled={!flow.phoneValid}>
                Get OTP <Icon name="arrow_forward" className="text-[18px]" />
              </Button>
            </section>
          )}

          {/* 5. OTP verification */}
          {flow.step === "OTP" && (
            <section className="bg-surface-container-lowest rounded-2xl p-4 border-2 border-primary/30 shadow-md space-y-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-label-md text-primary bg-primary-container/10 px-2 py-0.5 rounded-md mb-1 font-semibold">
                    <Icon name="mark_email_read" className="text-[12px]" />
                    OTP Sent Successfully
                  </div>
                  <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Enter Verification Code</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] mt-0.5">
                    Code sent to <span className="font-semibold text-on-surface">+91 {formatPhone(flow.phone)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={flow.backToPhone}
                  className="text-primary hover:underline font-label-md text-label-md font-semibold pt-1"
                >
                  Change
                </button>
              </div>

              <OtpInput
                value={flow.otp}
                onChange={flow.setOtp}
                autoFocus
                disabled={flow.submitting}
                error={Boolean(flow.error)}
                ariaLabel="Verification code"
              />

              <p className="font-body-sm text-[11px] text-outline text-center">
                Demo mode — enter any 6 digits to continue.
              </p>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center gap-1 text-on-surface-variant font-medium">
                  <Icon name="timer" className="text-[14px] text-tertiary" />
                  {flow.canResend ? (
                    <button type="button" onClick={flow.resendOtp} className="text-primary font-semibold hover:underline">
                      Resend OTP
                    </button>
                  ) : (
                    <span>
                      Resend OTP in{" "}
                      <span className="font-bold text-on-surface tabular">
                        00:{String(flow.secondsLeft).padStart(2, "0")}
                      </span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    flow.resendOtp();
                    toast("Code re-sent on WhatsApp", "success");
                  }}
                  className="text-secondary font-semibold hover:underline flex items-center gap-0.5"
                >
                  <Icon name="send" className="text-[12px]" /> WhatsApp Code
                </button>
              </div>

              <Button
                fullWidth
                size="lg"
                loading={flow.submitting}
                onClick={() => void handleVerify()}
                disabled={!flow.otpComplete}
              >
                Verify &amp; Continue <Icon name="check_circle" className="text-[18px]" />
              </Button>
            </section>
          )}

          {/* 6. Alternate access */}
          <div className="pt-1 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-outline-variant/40 w-full"></div>
              <span className="bg-surface-container-lowest px-3 font-label-md text-label-md text-outline uppercase tracking-wider relative">
                or continue without OTP
              </span>
            </div>

            <Button fullWidth size="lg" variant="secondary" onClick={() => void handleDemo("CUSTOMER")}>
              <Icon name="shopping_basket" className="text-[20px]" /> Explore Market as Guest Buyer
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => void handleDemo("SELLER")}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
              >
                <Icon name="store" className="text-[14px]" />
                <span>
                  Looking to supply? <strong className="text-primary underline">Dealer / FPO Portal</strong>
                </span>
              </button>
            </div>
          </div>

          {/* 7. Trust assurance */}
          <TrustAssuranceRow />

          {/* 8. Footer & helpline */}
          <footer className="pt-2 pb-4 text-center space-y-2">
            <p className="font-body-sm text-body-sm text-outline text-[11px] leading-relaxed px-2">
              By signing in, you agree to KrishiBazaar's{" "}
              <button
                type="button"
                onClick={() => toast("Terms of Service coming soon", "info")}
                className="underline text-on-surface-variant"
              >
                Terms of Service
              </button>{" "}
              &amp;{" "}
              <button
                type="button"
                onClick={() => toast("Privacy Policy coming soon", "info")}
                className="underline text-on-surface-variant"
              >
                Privacy Policy
              </button>
              .
            </p>
            <div className="inline-flex items-center gap-1.5 bg-surface border border-outline-variant/40 rounded-full px-3 py-1">
              <Icon name="support_agent" className="text-[12px] text-primary" />
              <span className="text-[11px] font-label-md text-on-surface-variant">
                Kisan Helpline:{" "}
                <a href="tel:18004195747" className="font-bold text-primary hover:underline">
                  1800-419-KRISHI
                </a>{" "}
                (7 AM - 9 PM)
              </span>
            </div>
            <div>
              <Link to="/" className="font-body-sm text-body-sm text-primary font-semibold hover:underline">
                Skip for now — continue browsing
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
