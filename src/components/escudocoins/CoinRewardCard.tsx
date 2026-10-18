import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface CoinReward {
  id: number;
  earned: number;
  balance: number;
}

/**
 * Tarjeta de reconocimiento discreta que aparece DESPUÉS de la recomendación.
 * Se desvanece sola a los 7 segundos o puede cerrarse manualmente.
 */
export function CoinRewardCard({ reward, onClose }: { reward: CoinReward; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const enter = window.setTimeout(() => setIsVisible(true), 20);
    const leave = window.setTimeout(() => setIsVisible(false), 7000);
    const remove = window.setTimeout(onClose, 7500);
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(leave);
      window.clearTimeout(remove);
    };
  }, [onClose]);

  return (
    <div
      role="status"
      className={`mx-auto w-full max-w-[92%] rounded-2xl border border-wa-send/20 bg-wa-bubble-in px-4 py-3.5 shadow-[var(--shadow-bubble)] transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 text-[20px] leading-none">
          🪙
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-wa-bubble-in-foreground">
            Excelente decisión
          </p>
          <p className="mt-1 text-[14px] leading-snug text-muted-foreground">
            Consultó antes de actuar y ayudó a proteger su información.
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-wa-composer px-3 py-2">
            <span className="text-[14.5px] font-semibold text-wa-send">
              +{reward.earned} EscudoCoins
            </span>
            <span className="text-[13px] text-muted-foreground">
              Saldo: {reward.balance}
            </span>
          </div>
        </div>
        <Button variant="chat" size="chat"
          type="button"
          onClick={onClose}
          aria-label="Cerrar reconocimiento"
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors active:bg-wa-composer"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}