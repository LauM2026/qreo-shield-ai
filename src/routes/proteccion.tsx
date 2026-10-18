import { createFileRoute } from "@tanstack/react-router";
import { IncomingBubble, WhatsAppChat } from "@/components/chat/WhatsAppChat";

export const Route = createFileRoute("/proteccion")({
  head: () => ({ meta: [
    { title: "Protección y Fraude — QIA" },
    { name: "description", content: "Consulte con QIA mensajes, enlaces, imágenes y notas de voz para reconocer posibles fraudes." },
    { property: "og:title", content: "Protección y Fraude — QIA" },
    { property: "og:description", content: "Orientación de Qreo antes, durante y después de un posible fraude digital." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Protection,
});

function Protection() {
  return <WhatsAppChat>
    <IncomingBubble time="QIA">
      <p>Hola. Soy QIA, su asistente oficial de protección digital de Qreo. Estoy aquí para acompañarlo antes, durante y después de una posible situación de fraude digital.</p>
      <p className="mt-3">Puede enviarme enlaces, mensajes de WhatsApp, correos electrónicos, capturas de pantalla, fotografías, códigos QR o notas de voz para ayudarle a identificar posibles señales de riesgo.</p>
      <p className="mt-3">Recuerde que nunca le pediré contraseñas, códigos de verificación, claves bancarias ni información de sus tarjetas. Tampoco realizo operaciones sobre sus productos financieros. Si alguien solicita esa información en nombre de Qreo, desconfíe inmediatamente.</p>
      <p className="mt-3">Cuando una situación requiera atención especializada, le indicaré cómo comunicarse con un asesor de Qreo.</p>
    </IncomingBubble>
  </WhatsAppChat>;
}