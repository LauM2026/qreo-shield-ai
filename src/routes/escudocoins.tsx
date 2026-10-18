import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gift } from "lucide-react";
import { useEscudoCoins } from "@/hooks/use-escudocoins";

export const Route = createFileRoute("/escudocoins")({
  head: () => ({
    meta: [
      { title: "Mis EscudoCoins — QIA — Qreo" },
      {
        name: "description",
        content:
          "Consulte su saldo de EscudoCoins y los últimos reconocimientos que ha recibido por consultar con QIA antes de actuar frente a un posible fraude.",
      },
      { property: "og:title", content: "Mis EscudoCoins — QIA — Qreo" },
      {
        property: "og:description",
        content:
          "Saldo e historial de EscudoCoins: el reconocimiento de Qreo por sus comportamientos seguros frente al fraude digital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EscudoCoinsPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function EscudoCoinsPage() {
  const { balance, history, isReady } = useEscudoCoins();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col bg-wa-chat-bg shadow-xl">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-wa-header px-3 py-3 text-wa-header-foreground">
        <Link to="/" aria-label="Volver al menú principal" className="shrink-0 opacity-90">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-[17px] font-semibold">Mis EscudoCoins</h1>
      </header>

      <main className="flex-1 px-4 py-5">
        <section className="rounded-2xl bg-wa-bubble-in px-5 py-6 text-center shadow-[var(--shadow-bubble)]">
          <p className="text-[13.5px] uppercase tracking-wide text-muted-foreground">Saldo actual</p>
          <p className="mt-2 text-[34px] font-bold leading-none text-wa-header">
            <span aria-hidden="true">🪙 </span>
            {isReady ? balance : 0}
          </p>
          <p className="mt-2 text-[14px] text-muted-foreground">EscudoCoins</p>
          <p className="mx-auto mt-4 max-w-[20rem] text-[14px] leading-snug text-muted-foreground">
            Reconocimiento de Qreo por consultar antes de actuar frente a posibles fraudes.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-[15px] font-semibold text-wa-bubble-in-foreground">
            Últimos movimientos
          </h2>
          <ul className="mt-3 space-y-2">
            {history.length === 0 ? (
              <li className="rounded-2xl bg-wa-bubble-in px-4 py-4 text-[14.5px] leading-snug text-muted-foreground shadow-[var(--shadow-bubble)]">
                Aún no tiene movimientos. Cuando consulte un enlace, un mensaje, un correo o un
                código QR con QIA, verá aquí su reconocimiento.
              </li>
            ) : (
              history.slice(0, 10).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-wa-bubble-in px-4 py-3 shadow-[var(--shadow-bubble)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-wa-bubble-in-foreground">
                      {entry.label}
                    </span>
                    <span className="block text-[12.5px] text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold text-wa-send">
                    +{entry.amount}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <Link
          to="/beneficios"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-wa-send px-4 py-3.5 text-[16px] font-semibold text-wa-header-foreground transition-transform active:scale-[0.98]"
        >
          <Gift className="size-5" aria-hidden="true" />
          Ver beneficios
        </Link>
      </main>
    </div>
  );
}