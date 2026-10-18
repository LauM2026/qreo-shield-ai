import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, BookOpen, Landmark, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QiaShell } from "@/components/qia/QiaShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QIA — Asistente oficial de Qreo" },
      {
        name: "description",
        content:
          "Protección contra fraudes, aprendizaje de banca digital y orientación sobre créditos Qreo con QIA.",
      },
      { property: "og:title", content: "QIA — Asistente oficial de Qreo" },
      {
        property: "og:description",
        content:
          "Elija protección, aprendizaje o créditos: QIA le acompaña con orientación clara y sencilla.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <QiaShell home>
      <h1 className="text-2xl font-bold text-wa-header">Bienvenido a QIA</h1>
      <p className="mt-2 text-lg leading-relaxed">¿En qué podemos acompañarle hoy?</p>
      <nav aria-label="Menú principal" className="mt-6 flex flex-col gap-4">
        {[
          { to: "/proteccion" as const, icon: ShieldCheck, title: "Protección y Fraude", description: "Revise aquí si un mensaje, enlace o foto que recibió es seguro o es una estafa." },
          { to: "/educacion" as const, icon: BookOpen, title: "Educación Financiera", description: "Resuelva sus dudas sobre cómo usar la aplicación y manejar su dinero de forma segura." },
          { to: "/productos" as const, icon: Landmark, title: "Portafolio Qreo", description: "Consulte los créditos disponibles que tenemos para apoyarlo en sus proyectos." },
        ].map((item) => <Button key={item.to} asChild variant="chat" size="chat" className="min-h-36 w-full justify-start gap-4 rounded-lg border border-wa-send/30 bg-wa-bubble-in p-5 text-left text-wa-bubble-in-foreground hover:bg-wa-bubble-out">
          <Link to={item.to}>
            <item.icon className="size-7 text-wa-header" aria-hidden="true" />
            <span className="min-w-0 flex-1"><span className="block text-lg font-bold leading-snug">{item.title}</span><span className="mt-2 block text-base font-normal leading-relaxed">{item.description}</span></span>
            <ChevronRight aria-hidden="true" className="text-wa-header" />
          </Link>
        </Button>)}
      </nav>
    </QiaShell>
  );
}
