import { config } from "../config.js";

/**
 * Thin SMS seam.
 *
 * No real provider is wired up yet, so the default ("console") just logs the
 * message. Adding one is a matter of implementing `SmsProvider` and registering
 * it below — the rest of the app only ever calls `sendOtpSms`.
 */
export interface SmsProvider {
  readonly name: string;
  send(phone: string, message: string): Promise<void>;
}

/** Development provider: writes the message to the server log. */
const consoleProvider: SmsProvider = {
  name: "console",
  async send(phone, message) {
    // Stay quiet during tests so the suite output stays readable.
    if (config.isTest) return;
    console.log(`[sms:console] -> ${phone}: ${message}`);
  }
};

const providers: Record<string, SmsProvider> = {
  console: consoleProvider
  // msg91: { name: "msg91", async send(phone, message) { ... } },
  // twilio: { name: "twilio", async send(phone, message) { ... } }
};

export function getSmsProvider(): SmsProvider {
  const provider = providers[config.smsProvider];
  if (!provider) {
    throw new Error(
      `Unknown SMS_PROVIDER "${config.smsProvider}". Available: ${Object.keys(providers).join(", ")}.`
    );
  }
  if (config.isProduction && provider.name === "console") {
    throw new Error(
      "No SMS provider configured, so one-time passcodes cannot be delivered. " +
        "Set SMS_PROVIDER to a real provider and supply its credentials before deploying."
    );
  }
  return provider;
}

/** Sends a sign-in code. Throws if no usable provider is configured. */
export async function sendOtpSms(phone: string, code: string, expirySeconds: number): Promise<void> {
  const minutes = Math.max(1, Math.round(expirySeconds / 60));
  await getSmsProvider().send(
    phone,
    `${code} is your KrishiBazaar verification code. It expires in ${minutes} minute(s).`
  );
}
