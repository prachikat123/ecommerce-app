import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "../api/types";
import { useSession } from "../store/SessionContext";

export type LoginRole = "CUSTOMER" | "SELLER";
export type LoginStep = "PHONE" | "OTP";

/** Number of one-time-code digits, and the cooldown before a resend is allowed. */
export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 30;

const PHONE_PATTERN = /^[6-9]\d{9}$/;
const digitsOnly = (value: string, max: number) => value.replace(/\D/g, "").slice(0, max);

export interface UseLoginFlowResult {
  readonly step: LoginStep;
  readonly role: LoginRole;
  readonly phone: string;
  readonly otp: string;
  readonly phoneValid: boolean;
  readonly otpComplete: boolean;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly secondsLeft: number;
  readonly canResend: boolean;
  setRole: (role: LoginRole) => void;
  setPhone: (value: string) => void;
  setOtp: (value: string) => void;
  requestOtp: () => Promise<void>;
  resendOtp: () => Promise<void>;
  backToPhone: () => void;
  verify: () => Promise<SessionUser | null>;
}

/**
 * Drives the phone → OTP sign-in flow shown on the KrishiBazaar login screen.
 *
 * A one-time passcode is requested from the API and verified server-side
 * (`POST /api/auth/otp/request` → `POST /api/auth/otp/verify`). Outside
 * production the API echoes the generated code back as `devCode`, which is
 * pre-filled here so the flow stays testable without an SMS provider.
 */
export function useLoginFlow(): UseLoginFlowResult {
  const { requestOtp: sendOtp, signInWithOtp } = useSession();
  const [step, setStep] = useState<LoginStep>("PHONE");
  const [role, setRole] = useState<LoginRole>("CUSTOMER");
  const [phone, setPhoneState] = useState("");
  const [otp, setOtpState] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (step !== "OTP" || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, secondsLeft]);

  const setPhone = useCallback((value: string) => {
    setPhoneState(digitsOnly(value, 10));
    setError(null);
  }, []);

  const setOtp = useCallback((value: string) => {
    setOtpState(digitsOnly(value, OTP_LENGTH));
    setError(null);
  }, []);

  const requestOtp = useCallback(async () => {
    if (!PHONE_PATTERN.test(phone)) {
      setError("Enter a valid 10-digit mobile number starting with 6-9");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await sendOtp(phone, role);
      // Pre-filled in development so the flow works without an SMS provider.
      setOtpState(res.devCode ?? "");
      setSecondsLeft(RESEND_SECONDS);
      setStep("OTP");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [phone, role, sendOtp]);

  const resendOtp = useCallback(async () => {
    if (!PHONE_PATTERN.test(phone)) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await sendOtp(phone, role);
      setOtpState(res.devCode ?? "");
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [phone, role, sendOtp]);

  const backToPhone = useCallback(() => {
    setStep("PHONE");
    setOtpState("");
    setError(null);
    setSecondsLeft(0);
  }, []);

  const verify = useCallback(async (): Promise<SessionUser | null> => {
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code`);
      return null;
    }
    setSubmitting(true);
    setError(null);
    try {
      return await signInWithOtp(phone, otp, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [otp, phone, role, signInWithOtp]);

  return useMemo<UseLoginFlowResult>(
    () => ({
      step,
      role,
      phone,
      otp,
      phoneValid: PHONE_PATTERN.test(phone),
      otpComplete: otp.length === OTP_LENGTH,
      submitting,
      error,
      secondsLeft,
      canResend: secondsLeft === 0,
      setRole,
      setPhone,
      setOtp,
      requestOtp,
      resendOtp,
      backToPhone,
      verify
    }),
    [
      step,
      role,
      phone,
      otp,
      submitting,
      error,
      secondsLeft,
      setPhone,
      setOtp,
      requestOtp,
      resendOtp,
      backToPhone,
      verify
    ]
  );
}
