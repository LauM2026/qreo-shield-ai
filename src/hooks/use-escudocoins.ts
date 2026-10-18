import { useCallback, useEffect, useState } from "react";
import { getCoinStorage } from "@/services/coin-storage";
import { EMPTY_COIN_STATE, type CoinActionType, type CoinState } from "@/types/escudocoins";

/**
 * Estado de EscudoCoins para la interfaz. Nunca toca localStorage:
 * todo pasa por CoinStorageService.
 */
export function useEscudoCoins() {
  const [state, setState] = useState<CoinState>(EMPTY_COIN_STATE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getCoinStorage()
      .getCoins()
      .then((loaded) => {
        if (!active) return;
        setState(loaded);
        setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const award = useCallback(async (action: CoinActionType, signature?: string) => {
    const previous = await getCoinStorage().getCoins();
    const next = await getCoinStorage().addCoins(action, signature);
    setState(next);
    const earned = next.balance - previous.balance;
    return earned > 0 ? { earned, balance: next.balance } : null;
  }, []);

  const reset = useCallback(async () => {
    setState(await getCoinStorage().resetCoins());
  }, []);

  return { ...state, isReady, award, reset };
}