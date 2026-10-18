/**
 * CoinStorageService — capa de persistencia desacoplada de EscudoCoins.
 *
 * Ningún componente ni hook debe leer/escribir `localStorage` directamente:
 * todos consumen esta interfaz. Para migrar a otra infraestructura
 * (Lovable Cloud/Supabase, Firebase, API REST o la base de datos institucional
 * de Qreo) basta con:
 *
 *   1. Crear una nueva clase que implemente `CoinStorageService`
 *      (los métodos pueden ser asíncronos: ya devuelven Promesas).
 *   2. Devolverla desde `getCoinStorage()`.
 *
 * La interfaz de usuario y la lógica de negocio no requieren cambios.
 */
import {
  COIN_RULES,
  EMPTY_COIN_STATE,
  type CoinActionType,
  type CoinEntry,
  type CoinState,
} from "@/types/escudocoins";

export interface CoinStorageService {
  /** Saldo e historial actuales. */
  getCoins(): Promise<CoinState>;
  /** Registra una acción y devuelve el estado resultante. */
  addCoins(action: CoinActionType, signature?: string): Promise<CoinState>;
  /** Reemplaza por completo el estado almacenado. */
  saveCoins(state: CoinState): Promise<CoinState>;
  /** Vuelve a cero el saldo y el historial. */
  resetCoins(): Promise<CoinState>;
}

const STORAGE_KEY = "escudoia.escudocoins.v1";
/** Ventana anti-duplicados: misma acción + mismo contenido en pocos segundos. */
const DEDUPE_WINDOW_MS = 15_000;
const HISTORY_LIMIT = 50;

function isDuplicate(state: CoinState, action: CoinActionType, signature?: string) {
  if (!signature) return false;
  const now = Date.now();
  return state.history.some(
    (entry) =>
      entry.action === action &&
      entry.signature === signature &&
      now - new Date(entry.date).getTime() < DEDUPE_WINDOW_MS,
  );
}

function createEntry(action: CoinActionType, signature?: string): CoinEntry {
  const rule = COIN_RULES[action];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    action,
    label: rule.label,
    amount: rule.amount,
    signature,
  };
}

/** Implementación MVP: navegador, sin backend configurado. */
export class LocalStorageCoinService implements CoinStorageService {
  private read(): CoinState {
    if (typeof window === "undefined") return EMPTY_COIN_STATE;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_COIN_STATE;
      const parsed = JSON.parse(raw) as Partial<CoinState>;
      return {
        balance: typeof parsed.balance === "number" ? parsed.balance : 0,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    } catch {
      return EMPTY_COIN_STATE;
    }
  }

  private write(state: CoinState): CoinState {
    if (typeof window === "undefined") return state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento no disponible: el saldo vive solo en memoria */
    }
    return state;
  }

  async getCoins(): Promise<CoinState> {
    return this.read();
  }

  async addCoins(action: CoinActionType, signature?: string): Promise<CoinState> {
    const current = this.read();
    if (isDuplicate(current, action, signature)) return current;
    const entry = createEntry(action, signature);
    return this.write({
      balance: current.balance + entry.amount,
      history: [entry, ...current.history].slice(0, HISTORY_LIMIT),
    });
  }

  async saveCoins(state: CoinState): Promise<CoinState> {
    return this.write(state);
  }

  async resetCoins(): Promise<CoinState> {
    return this.write({ ...EMPTY_COIN_STATE, history: [] });
  }
}

let instance: CoinStorageService | null = null;

/** Punto único de acceso al servicio. Cambie aquí la implementación al escalar. */
export function getCoinStorage(): CoinStorageService {
  if (!instance) instance = new LocalStorageCoinService();
  return instance;
}