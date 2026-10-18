import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sprout, BriefcaseBusiness, Wrench, GraduationCap, House, ChevronRight } from "lucide-react";
import { QiaShell } from "@/components/qia/QiaShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [
    { title: "Portafolio Qreo — QIA" },
    { name: "description", content: "Conozca las opciones de crédito Qreo y reciba orientación para preparar su solicitud." },
    { property: "og:title", content: "Portafolio Qreo — QIA" },
    { property: "og:description", content: "Orientación sobre créditos agropecuarios, capital de trabajo, activos fijos, educación y vivienda." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Products,
});

const credits = [
  { title: "Crédito Pecuario y Agropecuario", icon: Sprout },
  { title: "Crédito para Capital de Trabajo", icon: BriefcaseBusiness },
  { title: "Crédito para Activos Fijos", icon: Wrench },
  { title: "Créditos para Educación", icon: GraduationCap },
  { title: "Crédito para Vivienda", icon: House },
];

function Products() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  return <QiaShell>
    <h1 className="text-2xl font-bold text-wa-header">{selected ?? "Portafolio Qreo"}</h1>
    {!selected ? <>
      <p className="mt-4 text-lg leading-relaxed">Conozca las opciones de crédito que Qreo tiene para usted. Seleccione el beneficio que le interesa para recibir orientación guiada paso a paso sobre cómo solicitarlo.</p>
      <div className="mt-6 flex flex-col gap-3">
        {credits.map(({ title, icon: Icon }) => <Button key={title} variant="chat" size="chat" onClick={() => { setSelected(title); setStep(0); }} className="min-h-20 w-full justify-start gap-4 rounded-lg border border-wa-send/30 bg-wa-bubble-in px-4 py-5 text-left text-lg font-semibold hover:bg-wa-bubble-out">
          <Icon className="text-wa-header" aria-hidden="true" /><span className="min-w-0 flex-1">{title}</span><ChevronRight aria-hidden="true" />
        </Button>)}
      </div>
    </> : <>
      <Button variant="chat" size="chat" onClick={() => setSelected(null)} className="mt-3 min-h-12 justify-start text-base font-semibold text-wa-header"><ArrowLeft aria-hidden="true" />Ver otras opciones de crédito</Button>
      <p className="mt-5 text-base font-semibold text-wa-header" aria-live="polite">Paso {step + 1} de 3</p>
      <section className="mt-3 space-y-4 text-lg leading-relaxed" aria-live="polite">
        {step === 0 && <><h2 className="text-xl font-bold">Defina su proyecto</h2><p>Antes de solicitar {selected.toLowerCase()}, piense para qué necesita el dinero y cuánto requiere. Tener claro el propósito le ayudará a explicar su proyecto a Qreo.</p><p>No comparta contraseñas, códigos de verificación ni información de sus tarjetas.</p></>}
        {step === 1 && <><h2 className="text-xl font-bold">Revise cuánto puede pagar</h2><p>Compare sus ingresos con sus gastos habituales y sus deudas actuales. Así podrá identificar cuánto puede destinar a una cuota sin descuidar sus necesidades.</p><p>Confirme directamente con Qreo los requisitos, documentos, tasas, plazos y costos vigentes. No contamos aquí con esas condiciones verificadas.</p></>}
        {step === 2 && <><h2 className="text-xl font-bold">Prepare su solicitud con Qreo</h2><p>En los canales oficiales de Qreo, indique la opción de crédito que le interesa y explique su proyecto. Solicite los requisitos y la información completa antes de enviar documentos o aceptar condiciones.</p><p>Esta orientación no presenta una solicitud ni garantiza su aprobación.</p></>}
      </section>
      <div className="mt-7 flex flex-wrap gap-3">
        {step > 0 && <Button variant="chat" size="chat" onClick={() => setStep(step - 1)} className="min-h-14 rounded-lg border border-wa-send/30 px-5 text-base text-wa-header"><ArrowLeft aria-hidden="true" />Paso anterior</Button>}
        <Button variant="chat" size="chat" onClick={() => step < 2 ? setStep(step + 1) : setSelected(null)} className="min-h-14 rounded-lg bg-wa-header px-5 text-base font-semibold text-wa-header-foreground">{step < 2 ? "Continuar" : "Ver otras opciones"}<ArrowRight aria-hidden="true" /></Button>
      </div>
    </>}
  </QiaShell>;
}