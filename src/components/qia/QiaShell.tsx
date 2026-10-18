import { Link } from "@tanstack/react-router";
import { ArrowLeft, Coins, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import avatar from "@/assets/qreo-avatar.png.asset.json";
import type { ReactNode } from "react";

export function QiaShell({ children, home = false }: { children: ReactNode; home?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col bg-wa-chat-bg text-wa-bubble-in-foreground">
      <header className="flex items-center gap-3 bg-wa-header px-5 py-4 text-wa-header-foreground">
        <img src={avatar.url} alt="Logo de Qreo" className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-2xl font-bold">QIA <BadgeCheck className="size-5 text-wa-verified" aria-hidden="true" /></p>
          <p className="text-sm leading-relaxed">Cuenta oficial verificada de Qreo · en línea</p>
        </div>
        <Button asChild variant="chat" size="chat" className="size-11 shrink-0" title="Mis EscudoCoins">
          <Link to="/escudocoins" aria-label="Mis EscudoCoins"><Coins aria-hidden="true" /></Link>
        </Button>
      </header>
      {!home && <nav className="border-b border-wa-send/20 bg-wa-composer px-4 py-2">
        <Button asChild variant="chat" size="chat" className="min-h-12 justify-start text-base font-semibold text-wa-header">
          <Link to="/"><ArrowLeft aria-hidden="true" />Volver al menú principal</Link>
        </Button>
      </nav>}
      <main className="flex-1 px-5 py-6">{children}</main>
    </div>
  );
}