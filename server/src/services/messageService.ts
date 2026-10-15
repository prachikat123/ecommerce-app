import { config } from "../config.js";

/**
 * Outbound messaging seam for one-time passcodes.
 *
 * `MESSAGE_PROVIDER` picks the channel. The default ("console") only logs the
 * code, which is what you want in development. For production, "whatsapp"
 * sends through the WhatsApp Business Cloud API (Meta).
 *
 * To add another channel (Twilio SMS, MSG91, Telegram …), implement
 * `MessageProvider`, register it in `providers` below, and set
 * `MESSAGE_PROVIDER` — nothing else in the app has to change.
 */

export interface OtpMessageInput {
  phone: string;
  code: string;
  expirySeconds: number;
}

export interface MessageProvider {
  readonly name: string;
  sendOtp(input: OtpMessageInput): Promise<void>;
}

/** Plain-text rendering, used by the console provider and as a fallback. */
export function renderOtpText({ code, expirySeconds }: OtpMessageInput): string {
  const minutes = Math.max(1, Math.round(expirySeconds / 60));
  return `${code} is your KrishiBazaar verification code. It expires in ${minutes} minute(s).`;
}

/**
 * Normalises a stored phone number into E.164 (`+919700001234`).
 *
 * Accepts "9700001234", "+91 9700001234" or "919700001234". Anything 11
 * digits or longer is treated as already international; shorter numbers get the
 * configured country code prepended.
 */
export function toE164(phone: string, countryCode: string = config.otpCountryCode): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length > 10) return `+${digits}`;
  const cc = countryCode.replace(/\D/g, "");
  return `+${cc}${digits}`;
}

/** Development provider: writes the code to the server log. */
const consoleProvider: MessageProvider = {
  name: "console",
  async sendOtp(input) {
    // Stay quiet during tests so the suite output stays readable.
    if (config.isTest) return;
    console.log(`[otp:console] -> ${input.phone}: ${renderOtpText(input)}`);
  }
};

/**
 * WhatsApp Business Cloud API provider (Meta).
 *
 * Requires a WhatsApp Business account with a phone number ID, a system-user
 * access token, and a pre-approved message template whose body takes the code
 * (and optionally the expiry) as variables.
 */
const whatsappProvider: MessageProvider = {
  name: "whatsapp",
  async sendOtp(input) {
    const { whatsappPhoneNumberId, whatsappAccessToken } = config;
    if (!whatsappPhoneNumberId || !whatsappAccessToken) {
      throw new Error(
        'MESSAGE_PROVIDER is "whatsapp" but WHATSAPP_PHONE_NUMBER_ID and/or WHATSAPP_ACCESS_TOKEN are not set.'
      );
    }

    const minutes = Math.max(1, Math.round(input.expirySeconds / 60));
    // Meta expects the recipient as bare E.164 digits, without the leading "+".
    const to = toE164(input.phone).slice(1);

    const response = await fetch(
      `https://graph.facebook.com/${config.whatsappApiVersion}/${whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: config.whatsappTemplateName,
            language: { code: config.whatsappTemplateLanguage },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: input.code },
                  { type: "text", text: String(minutes) }
                ]
              }
            ]
          }
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `WhatsApp send failed (HTTP ${response.status}): ${detail || response.statusText}`
      );
    }
  }
};

const providers: Record<string, MessageProvider> = {
  console: consoleProvider,
  whatsapp: whatsappProvider
};

export function getMessageProvider(): MessageProvider {
  const provider = providers[config.messageProvider];
  if (!provider) {
    throw new Error(
      `Unknown MESSAGE_PROVIDER "${config.messageProvider}". Available: ${Object.keys(providers).join(", ")}.`
    );
  }
  if (config.isProduction && provider.name === "console") {
    throw new Error(
      "No message provider configured, so one-time passcodes cannot be delivered. " +
        'Set MESSAGE_PROVIDER="whatsapp" and supply its credentials before deploying.'
    );
  }
  return provider;
}

/** Sends a sign-in code. Throws if the selected channel is misconfigured. */
export async function sendOtpMessage(input: OtpMessageInput): Promise<void> {
  await getMessageProvider().sendOtp(input);
}
