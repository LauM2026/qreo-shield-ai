# Escudo IA (QIA) by Qreo — despliegue manual

Código fuente completo de la aplicación: asistente conversacional de protección digital
con interfaz tipo WhatsApp, análisis de voz / imágenes / QR / documentos, educación
financiera, EscudoCoins y portafolio de créditos.

Pila: TanStack Start v1 (React 19 + Vite 8 + Tailwind CSS 4). Sin base de datos y sin
cuentas de usuario: lo que se guarda (EscudoCoins, historial) vive en el navegador.

## 1. Requisitos

- Node.js 20 o superior (recomendado 22) y npm.
- Alternativa: Bun (el proyecto incluye `bun.lock`).

## 2. Instalación y ejecución

```sh
npm install
npm run dev        # desarrollo, http://localhost:8080
npm run build      # compila la versión de producción
npm run preview    # sirve la compilación localmente
```

## 3. Variable de entorno obligatoria

El análisis de notas de voz, capturas, QR y documentos, y las respuestas del asistente,
se hacen en el servidor (`src/routes/api/analyze-voice.ts`) contra la pasarela de IA:

- URL: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Modelo: `google/gemini-3.6-flash`
- Clave: variable de entorno `LOVABLE_API_KEY` (leída con `process.env.LOVABLE_API_KEY`)

Sin esa variable, el endpoint responde `Falta la configuración de IA.` y el chat no
devuelve análisis. Configure la clave en su proveedor de hosting, o cree un archivo
`.env` en la raíz del proyecto:

```
LOVABLE_API_KEY=su-clave
```

Para usar otro proveedor de IA, edite la llamada que está cerca de la línea 411 de
`src/routes/api/analyze-voice.ts` (URL del chat completions y nombre del modelo). La
clave nunca debe exponerse al navegador: no la mueva a una variable `VITE_`.

## 4. Imágenes del logo

Los dos PNG del logo de Qreo se incluyen como archivos locales en
`public/brand/` (se sirven en `/brand/qreo-avatar.png` y `/brand/qreo-imagotipo.png`).
Los punteros `src/assets/*.asset.json` ya apuntan a esas copias, así que el sitio se ve
igual que en Lovable sin depender de su almacenamiento.

## 5. Notas del despliegue

- El complemento de compilación (`@lovable.dev/vite-tanstack-config`) usa Nitro con
  Cloudflare Workers como destino por defecto y genera `.output/`. Para otro destino
  (Node, Docker, Vercel…) configure Nitro en `vite.config.ts` antes de compilar.
- No hay migraciones ni tablas que crear: la aplicación no necesita base de datos.
- `src/routeTree.gen.ts` es autogenerado; se regenera solo al ejecutar `dev` o `build`.
- Enlaces de contacto del asesor humano (por si desea cambiarlos):
  WhatsApp `https://wa.me/573004342525` y llamada `tel:+573167546030`, ambos definidos
  en `src/components/chat/WhatsAppChat.tsx`.
- El micrófono y la cámara requieren HTTPS (o `localhost`) para funcionar en el navegador.

## 6. Estructura

```text
src/components/chat/WhatsAppChat.tsx  conversación, micrófono, cámara, adjuntos, veredictos
src/components/qia/QiaShell.tsx       cabecera con logo, estado "QIA" y navegación
src/routes/index.tsx                  menú principal (3 opciones)
src/routes/proteccion.tsx             módulo Protección y Fraude
src/routes/educacion.tsx              módulo Educación Financiera
src/routes/productos.tsx              módulo Portafolio Qreo (créditos)
src/routes/escudocoins.tsx            historial de puntos
src/routes/beneficios.tsx             sección de beneficios
src/routes/api/analyze-voice.ts       análisis multimodal + preguntas de aprendizaje
src/lib/financial-education-kb.ts     base de conocimiento (Colombia)
src/lib/sanitize-reply.ts             limpieza del texto del modelo
src/lib/reply-quality.ts              control de calidad de la respuesta
src/lib/share-alert.ts                alertas para compartir (anonimizadas)
src/lib/coin-actions.ts, src/hooks/use-escudocoins.ts, src/services/coin-storage.ts  EscudoCoins
```
