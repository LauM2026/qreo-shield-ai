/**
 * Garantiza que al usuario solo le llegue el texto conversacional final:
 * nada de JSON, llaves, nombres de campos internos ni fragmentos del prompt.
 */
const FALLBACK =
  "Tuve un inconveniente al preparar la respuesta. ¿Puede contarme de nuevo, con sus palabras, qué recibió o qué duda tiene? Con gusto lo reviso.";

const TECHNICAL_HINTS =
  /("reply"|"risk"|"stage"|"advisor"|"followUp"|"question"|system prompt|Master Prompt|## \d|```)/i;

export function sanitizeReply(raw: string | undefined | null): string {
  let text = (raw ?? "").trim();
  if (!text) return FALLBACK;

  // Si viene envuelto en JSON o en un bloque de código, extraemos "reply".
  for (let i = 0; i < 3; i += 1) {
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced) text = fenced[1].trim();
    if (text.startsWith("{")) {
      const inner = extractReply(text);
      if (inner) {
        text = inner.trim();
        continue;
      }
    }
    break;
  }

  // Restos de estructura técnica al inicio o al final.
  text = text
    .replace(/^\s*[{[]+\s*/g, "")
    .replace(/\s*[}\]]+\s*$/g, "")
    .replace(/^"?reply"?\s*:\s*"?/i, "")
    .replace(/,?\s*"(risk|stage|advisor|followUp|question|no|yes)"\s*:\s*("[^"]*"|true|false|null|\{[\s\S]*?\})/gi, "")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/^"|"$/g, "")
    .trim();

  if (!text || TECHNICAL_HINTS.test(text)) return FALLBACK;
  return text;
}

function extractReply(candidate: string): string | null {
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const value = parsed.reply ?? parsed.respuesta ?? parsed.respuesta_final;
    return typeof value === "string" ? value : null;
  } catch {
    const match = candidate.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    return match ? match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : null;
  }
}
