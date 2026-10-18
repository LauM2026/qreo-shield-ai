import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Handshake, Megaphone, Sparkle } from "lucide-react";

export const Route = createFileRoute("/beneficios")({
  head: () => ({
    meta: [
      { title: "Beneficios EscudoCoins — QIA — Qreo" },
      {
        name: "description",
        content:
          "Conozca los beneficios que próximamente podrá redimir con sus EscudoCoins: beneficios exclusivos de Qreo, campañas especiales y beneficios con aliados.",
      },
      { property: "og:title", content: "Beneficios EscudoCoins — QIA — Qreo" },
      {
        property: "og:description",
        content:
          "Próximamente podrá redimir sus EscudoCoins por beneficios ofrecidos por Qreo y sus aliados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BeneficiosPage,
});

const BENEFITS = [
  {
    icon: Sparkle,
    title: "Beneficios exclusivos Qreo",
    description: "Reconocimientos para quienes cuidan su información con constancia.",
  },
  {
    icon: Megaphone,
    title: "Campañas especiales",
    description: "Participación en campañas de educación financiera y prevención del fraude.",
  },
  {
    icon: Handshake,
    title: "Beneficios con aliados",
    description: "Ventajas ofrecidas por entidades aliadas de Qreo.",
  },
];

function BeneficiosPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col bg-wa-chat-bg shadow-xl">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-wa-header px-3 py-3 text-wa-header-foreground">
        <Link to="/escudocoins" aria-label="Volver a Mis EscudoCoins" className="shrink-0 opacity-90">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-[17px] font-semibold">Beneficios</h1>
      </header>

      <main className="flex-1 px-4 py-5">
        <p className="rounded-2xl bg-wa-bubble-in px-4 py-4 text-[15.5px] leading-relaxed text-wa-bubble-in-foreground shadow-[var(--shadow-bubble)]">
          Próximamente podrá redimir sus EscudoCoins por beneficios ofrecidos por Qreo.
        </p>

        <ul className="mt-4 space-y-3">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="flex items-start gap-3 rounded-2xl bg-wa-bubble-in px-4 py-4 shadow-[var(--shadow-bubble)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wa-send/10 text-wa-send">
                <benefit.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15.5px] font-semibold text-wa-bubble-in-foreground">
                  {benefit.title}
                </span>
                <span className="mt-1 block text-[14px] leading-snug text-muted-foreground">
                  {benefit.description}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 px-1 text-[13px] leading-snug text-muted-foreground">
          La redención de EscudoCoins aún no está disponible. Le informaremos por este mismo canal
          cuando lo esté.
        </p>
      </main>
    </div>
  );
}