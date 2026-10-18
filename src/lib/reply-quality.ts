/**
 * Control de calidad de la respuesta ANTES de mostrarla al usuario.
 * Si algo falla, el endpoint vuelve a pedir la generación con el mismo contexto.
 */
const INTERNAL_TOKENS =
  /(^|[\s"'`{,])(reply|question|recommendation|analysis|followUp|risk|stage|advisor|system|assistant|tool|tool_call|role)\s*[":=]/i;

const PROMPT_FRAGMENTS =
  /(master prompt|system prompt|##\s*\d|checklist silencioso|base de conocimiento|```)/i;

const ENDING_OK = /[.!?…)"»”\]]$/;

export type QualityIssue =
  | "vacio"
  | "json"
  | "campos-internos"
  | "fragmento-prompt"
  | "parentesis"
  | "comillas"
  | "truncado"
  | "palabra-cortada"
  | "muy-corto";

export function checkReplyQuality(
  raw: string | null | undefined,
  options: { minWords?: number } = {},
): { ok: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = [];
  const text = (raw ?? "").trim();

  if (!text) return { ok: false, issues: ["vacio"] };

  if (/^[{[]/.test(text) || /"\s*:\s*"/.test(text)) issues.push("json");
  if (INTERNAL_TOKENS.test(text)) issues.push("campos-internos");
  if (PROMPT_FRAGMENTS.test(text)) issues.push("fragmento-prompt");

  const open = (text.match(/\(/g) ?? []).length;
  const close = (text.match(/\)/g) ?? []).length;
  if (open !== close) issues.push("parentesis");
  if (((text.match(/"/g) ?? []).length % 2) !== 0) issues.push("comillas");

  // El cierre debe completar la idea, no cortarse a mitad de frase.
  if (!ENDING_OK.test(text) || /[,;:—-]$/.test(text)) issues.push("truncado");

  if (/\b(por ejemplo|es decir|como|y|o|que|de|para|con|en|si|pero|cuando|porque|además)\s*$/i.test(text)) {
    issues.push("truncado");
  }

  const words = text.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1]?.replace(/[^\p{L}\p{N}]/gu, "") ?? "";
  // Una palabra final sin vocal (y de más de dos letras) suele estar partida.
  if (last.length > 2 && !/[aeiouáéíóúü]/i.test(last)) issues.push("palabra-cortada");

  const minWords = options.minWords ?? 12;
  if (words.length < minWords) issues.push("muy-corto");

  return { ok: issues.length === 0, issues };
}

export const QUALITY_FALLBACK =
  "No pude completar correctamente el análisis en este momento. ¿Podría intentar nuevamente en unos segundos? Quiero asegurarme de ofrecerle una respuesta completa y confiable.";
