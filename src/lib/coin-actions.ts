import type { CoinActionType } from "@/types/escudocoins";

const URL_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|link|info|xyz|app)\b)/i;
const EMAIL_HINT = /(correo|email|e-mail|remitente|bandeja de entrada|@[a-z0-9-]+\.[a-z]{2,})/i;
const QR_HINT = /\b(qr|código qr|codigo qr)\b/i;
const REPORT_HINT = /\b(report(ar|e|o)|denunci(ar|a|o)|estafa(ron)?|me robaron|fraude)\b/i;

/**
 * Deduce qué comportamiento seguro realizó la persona, para reconocerlo con
 * EscudoCoins una vez el análisis terminó correctamente.
 */
export function classifyCoinAction(input: {
  text?: string;
  fileName?: string;
  fileType?: string;
  hasAudio?: boolean;
  alreadyActed?: boolean;
}): CoinActionType {
  const text = input.text ?? "";
  if (input.alreadyActed || REPORT_HINT.test(text)) return "report";
  if (QR_HINT.test(text) || QR_HINT.test(input.fileName ?? "")) return "qr";
  if (EMAIL_HINT.test(text)) return "email";
  if (URL_PATTERN.test(text)) return "link";
  return "message";
}

/** Huella estable del contenido analizado, para no duplicar monedas. */
export function coinSignature(parts: (string | number | undefined)[]) {
  return parts
    .filter(Boolean)
    .join("|")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 200);
}