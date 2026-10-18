import { createFileRoute } from "@tanstack/react-router";
import { IncomingBubble, WhatsAppChat } from "@/components/chat/WhatsAppChat";

export const Route = createFileRoute("/educacion")({
  head: () => ({ meta: [
    { title: "Educación Financiera — QIA" },
    { name: "description", content: "Resuelva sus dudas sobre banca digital y el manejo seguro de su dinero con QIA." },
    { property: "og:title", content: "Educación Financiera — QIA" },
    { property: "og:description", content: "Aprenda con explicaciones claras de QIA, el asistente de Qreo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Education,
});

function Education() {
  return <WhatsAppChat topic="Educación Financiera">
    <IncomingBubble time="QIA">
      <p>¡Bienvenido a su espacio de aprendizaje! Estoy aquí para resolver todas sus dudas sobre el uso de la banca digital y el manejo seguro de su dinero. Puede escribirme su pregunta o enviarme una nota de voz, y con gusto le responderé de forma clara.</p>
    </IncomingBubble>
  </WhatsAppChat>;
}