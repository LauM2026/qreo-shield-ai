/**
 * Tipos del módulo EscudoCoins.
 * EscudoCoins es parte de Escudo IA: reconoce comportamientos seguros del usuario.
 */

/** Acciones que otorgan EscudoCoins al finalizar correctamente un análisis. */
export type CoinActionType =
  | "link"
  | "message"
  | "qr"
  | "email"
  | "report"
  | "share";

export interface CoinRule {
  /** Texto mostrado en el historial. */
  label: string;
  /** Monedas otorgadas por la acción. */
  amount: number;
}

export const COIN_RULES: Record<CoinActionType, CoinRule> = {
  link: { label: "Consulta de enlace", amount: 10 },
  message: { label: "Análisis de mensaje sospechoso", amount: 10 },
  qr: { label: "Verificación de código QR", amount: 10 },
  email: { label: "Análisis de correo electrónico", amount: 10 },
  report: { label: "Reporte de posible fraude", amount: 15 },
  share: { label: "Alerta de prevención compartida", amount: 10 },
};

export interface CoinEntry {
  id: string;
  /** Fecha ISO del movimiento. */
  date: string;
  action: CoinActionType;
  label: string;
  amount: number;
  /** Huella del contenido analizado, usada para evitar duplicados. */
  signature?: string;
}

export interface CoinState {
  balance: number;
  history: CoinEntry[];
}

export const EMPTY_COIN_STATE: CoinState = { balance: 0, history: [] };