/**
 * Alerta de prevención compartible.
 *
 * Nunca se comparte la conversación: solo un resumen anonimizado generado a
 * partir del análisis, con el formato listo para leerse en WhatsApp.
 */
export interface ShareAlert {
  /** Resumen neutral de lo ocurrido. */
  what: string;
  /** Principal señal de riesgo detectada (máximo dos líneas). */
  why: string;
  /** Qué debe hacer quien reciba la alerta. */
  advice: string;
}

const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|co|net|org|link|info|xyz|app|gov)(?:\.[a-z]{2})?(?:\/\S*)?/gi;
const EMAIL_RE = /\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/gi;
const PHONE_RE = /(?:\+?\d[\d .-]{6,}\d)/g;
const MONEY_RE = /(?:\$|COP|USD)\s?[\d.,]+(?:\s?(?:mil|millones))?/gi;
const ID_RE = /\b(?:c\.?c\.?|cédula|cedula|nit|documento)\s*[:#]?\s*[\d.\-]{5,}/gi;

/** Elimina cualquier dato que permita identificar a la persona o al mensaje original. */
export function anonymize(text: string): string {
  return text
    .replace(URL_RE, "un enlace")
    .replace(EMAIL_RE, "un correo")
    .replace(ID_RE, "un documento")
    .replace(MONEY_RE, "una suma de dinero")
    .replace(PHONE_RE, "un número")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Arma el texto final de la alerta, con emojis y saltos de línea para WhatsApp. */
export function buildAlertMessage(alert: ShareAlert): string {
  return [
    "🛡️ *Alerta de posible fraude*",
    "",
    "*¿Qué ocurrió?*",
    anonymize(alert.what),
    "",
    "*¿Por qué puede tratarse de un fraude?*",
    anonymize(alert.why),
    "",
    "*Recomendación*",
    anonymize(alert.advice),
    "",
    "Protejamos a quienes más queremos.",
    "Si recibe una situación similar, primero verifíquela con QIA de Qreo.",
    "",
    "Esta alerta fue generada automáticamente por QIA de Qreo a partir de un caso real reportado por un usuario, con la información personal anonimizada para proteger su privacidad.",
  ].join("\n");
}

export type ShareOutcome = "shared" | "cancelled" | "copied" | "failed";

/** Comparte con la API nativa; si no existe, abre WhatsApp; si falla, copia al portapapeles. */
export async function shareAlert(message: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text: message });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }

  try {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) return "shared";
  } catch {
    /* seguimos al respaldo */
  }

  try {
    await navigator.clipboard.writeText(message);
    return "copied";
  } catch {
    return "failed";
  }
}
