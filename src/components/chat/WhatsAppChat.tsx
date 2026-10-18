import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  Coins,
  FileText,
  Headphones,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Pause,
  Phone,
  Play,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import qreoAvatar from "@/assets/qreo-avatar.png.asset.json";
import { useEscudoCoins } from "@/hooks/use-escudocoins";
import { classifyCoinAction, coinSignature } from "@/lib/coin-actions";
import { CoinRewardCard, type CoinReward } from "@/components/escudocoins/CoinRewardCard";
import { sanitizeReply } from "@/lib/sanitize-reply";
import { checkReplyQuality, QUALITY_FALLBACK } from "@/lib/reply-quality";
import { buildAlertMessage, shareAlert, type ShareAlert } from "@/lib/share-alert";

function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 1.5l2.4 1.9 3-.4 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.4L12 22.5l-2.4-1.9-3 .4-1-2.9L3 16.5l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .4L12 1.5z" />
      <path d="M10.8 15.6l-3-3 1.3-1.3 1.7 1.7 4.1-4.1 1.3 1.3-5.4 5.4z" fill="var(--wa-header)" />
    </svg>
  );
}

type Risk = "red" | "yellow" | "green" | "none";

interface FollowUp {
  question: string;
  no: string;
  yes: string;
}

interface Analysis {
  reply: string;
  risk: Risk;
  stage: "prevencion" | "deteccion" | "respuesta";
  advisor: boolean;
  followUp: FollowUp | null;
  alert: ShareAlert | null;
}

type ThreadItem =
  | { kind: "voice"; id: number; url: string; seconds: number; time: string }
  | { kind: "out-image"; id: number; url: string; name: string; time: string }
  | { kind: "out-file"; id: number; name: string; size: number; time: string }
  | { kind: "reply"; id: number; text: string; time: string }
  | {
      kind: "verdict";
      id: number;
      text: string;
      time: string;
      risk: Risk;
      advisor: boolean;
      alert: ShareAlert | null;
    }
  | { kind: "out-text"; id: number; text: string; time: string }
  | { kind: "followup"; id: number; time: string; followUp: FollowUp; answered: null | "no" | "si" }
  | { kind: "feedback"; id: number; time: string; answered: null | "ok" | "mas" };

const ANALYSIS_STEPS = [
  "Analizando la información…",
  "Identificando posibles señales de riesgo…",
  "Preparando una recomendación para usted…",
];

function buildClosingMessage(earned: number | null) {
  const coins = earned
    ? `\nPor consultar antes de actuar ha obtenido ${earned} EscudoCoins. Puede revisar su saldo en la sección Mis EscudoCoins.`
    : "";
  return `Me alegra haber podido ayudarle.${coins}\nRecuerde que siempre puede volver a consultarme cualquier duda antes de tomar una decisión.\nEstoy aquí para acompañarle.`;
}

function nowTime() {
  return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

export function WhatsAppChat({ children, topic = "Protección y Fraude" }: { children: ReactNode; topic?: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [statusStep, setStatusStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCameraSheetOpen, setIsCameraSheetOpen] = useState(false);
  const [liveCamera, setLiveCamera] = useState<MediaStream | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const pendingEvidenceRef = useRef<{ text?: string; fileName?: string; fileType?: string }>({});
  const [reward, setReward] = useState<CoinReward | null>(null);
  const [attachment, setAttachment] = useState<{ file: File; url: string | null } | null>(null);
  const lastEarnedRef = useRef<number | null>(null);
  const { award } = useEscudoCoins();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const threadRef = useRef<ThreadItem[]>([]);
  threadRef.current = thread;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (thread.length === 0 && !isThinking) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, isThinking]);

  useEffect(() => {
    if (!isThinking) return;
    setStatusStep(0);
    const id = window.setInterval(
      () => setStatusStep((step) => Math.min(step + 1, ANALYSIS_STEPS.length - 1)),
      1400,
    );
    return () => window.clearInterval(id);
  }, [isThinking]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      threadRef.current.forEach((item) => {
        if (item.kind === "voice" || item.kind === "out-image") URL.revokeObjectURL(item.url);
      });
    };
  }, []);

  function grantCoins(alreadyActed: boolean) {
    const evidence = pendingEvidenceRef.current;
    const action = classifyCoinAction({ ...evidence, alreadyActed });
    const signature = coinSignature([evidence.text, evidence.fileName, evidence.fileType]);
    window.setTimeout(() => {
      void award(action, signature).then((result) => {
        if (result) {
          lastEarnedRef.current = result.earned;
          setReward({ id: Date.now(), ...result });
        }
      });
    }, 900);
  }

  /**
   * Una sola llamada al asistente. El modelo decide la etapa del ciclo del fraude,
   */

  /**
   * Compartir alerta de prevención. Se comparte solo el resumen anonimizado;
   * el reconocimiento en EscudoCoins aparece únicamente si el envío se completó.
   */
  async function handleShareAlert(alert: ShareAlert) {
    setError(null);
    const outcome = await shareAlert(buildAlertMessage(alert));
    if (outcome === "cancelled") return;
    if (outcome === "failed") {
      setError("No pudimos abrir el menú de compartir. Inténtelo de nuevo, por favor.");
      return;
    }
    const result = await award("share", coinSignature([alert.what]));
    const coins = result
      ? `\nHa ganado ${result.earned} EscudoCoins por contribuir a proteger a otras personas.`
      : "";
    const copiedNote =
      outcome === "copied" ? "\nLa alerta quedó copiada; solo debe pegarla en el chat." : "";
    setThread((items) => [
      ...items,
      {
        kind: "reply" as const,
        id: Date.now(),
        text: `🎉 Gracias por ayudar a prevenir el fraude.${coins}${copiedNote}`,
        time: nowTime(),
      },
    ]);
  }

  /**
   * el nivel de riesgo, si hace falta una pregunta de seguimiento y si corresponde
   * ofrecer un asesor. La interfaz solo refleja esa decisión.
   */
  async function askEscudoIA(
    blob: Blob | null,
    filename = "nota-de-voz",
    note?: string,
    options?: { keepEvidence?: boolean; alreadyActed?: boolean },
  ) {
    const startedAt = Date.now();
    setIsThinking(true);
    if (!options?.keepEvidence) {
      pendingEvidenceRef.current = {
        text: note,
        fileName: blob ? filename : undefined,
        fileType: blob?.type,
      };
    }
    try {
      const body = new FormData();
      if (blob) body.append("audio", blob, filename);
      if (note) body.append("text", note);
      body.append("history", JSON.stringify(historyRef.current.slice(-12)));
      const response = await fetch("/api/analyze-voice", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as Partial<Analysis> & { error?: string };
      const waited = Date.now() - startedAt;
      if (waited < 2600) await new Promise((resolve) => setTimeout(resolve, 2600 - waited));
      if (!response.ok || !data.reply) {
        setError(data.error ?? "No pudimos analizar su consulta. Inténtelo de nuevo.");
        return;
      }
      const replyText = sanitizeReply(data.reply);
      // Último control antes de renderizar: nunca mostramos texto parcial ni técnico.
      if (!checkReplyQuality(replyText, { minWords: 8 }).ok) {
        setError(QUALITY_FALLBACK);
        return;
      }
      historyRef.current.push({
        role: "user",
        content: note ?? (blob ? `[archivo adjunto: ${filename}]` : "[consulta]"),
      });

      const followUp = data.followUp;
      if (followUp?.question) {
        historyRef.current.push({
          role: "assistant",
          content: `${replyText}\n${followUp.question}`,
        });
        const baseId = Date.now();
        setThread((items) => [
          ...items,
          {
            kind: "verdict",
            id: baseId,
            text: replyText,
            time: nowTime(),
            risk: data.risk ?? "none",
            // Solo en riesgo alto que además requiera acompañamiento directo.
            advisor: data.advisor === true && data.risk === "red",
            alert: data.alert ?? null,
          },
          {
            kind: "followup",
            id: baseId + 1,
            time: nowTime(),
            followUp: {
              question: followUp.question,
              no: followUp.no || "No",
              yes: followUp.yes || "Sí",
            },
            answered: null,
          },
        ]);
        return;
      }

      historyRef.current.push({ role: "assistant", content: replyText });
      const id = Date.now();
      setThread((items) => [
        ...items,
        {
          kind: "verdict",
          id,
          text: replyText,
          time: nowTime(),
          risk: data.risk ?? "none",
          advisor: data.advisor === true && data.risk === "red",
          alert: data.alert ?? null,
        },
        { kind: "feedback", id: id + 1, time: nowTime(), answered: null },
      ]);
      grantCoins(options?.alreadyActed ?? data.stage === "respuesta");
    } catch {
      setError("No pudimos conectarnos. Revise su conexión e inténtelo de nuevo.");
    } finally {
      setIsThinking(false);
    }
  }

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 12 * 1024 * 1024) {
      setError("El archivo es muy pesado (máximo 12 MB). Envíe uno más liviano, por favor.");
      return;
    }
    if (attachment?.url) URL.revokeObjectURL(attachment.url);
    setAttachment({
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
  }

  function pushFile(file: File, note?: string) {
    setError(null);
    if (file.size > 12 * 1024 * 1024) {
      setError("El archivo es muy pesado (máximo 12 MB). Envíe uno más liviano, por favor.");
      return;
    }
    const id = Date.now();
    const time = nowTime();
    if (file.type.startsWith("image/")) {
      setThread((items) => [
        ...items,
        { kind: "out-image", id, url: URL.createObjectURL(file), name: file.name, time },
      ]);
    } else {
      setThread((items) => [
        ...items,
        { kind: "out-file", id, name: file.name || "documento", size: file.size, time },
      ]);
    }
    if (note) {
      setThread((items) => [
        ...items,
        { kind: "out-text", id: id + 1, text: note, time },
      ]);
    }
    void askEscudoIA(file, file.name || "adjunto", note);
  }

  function sendMessage() {
    const text = draft.trim();
    if (isThinking) return;
    if (attachment) {
      const { file, url } = attachment;
      if (url) URL.revokeObjectURL(url);
      setAttachment(null);
      setDraft("");
      pushFile(file, text || undefined);
      return;
    }
    if (!text) return;
    setError(null);
    setDraft("");
    setThread((items) => [...items, { kind: "out-text", id: Date.now(), text, time: nowTime() }]);
    void askEscudoIA(null, "consulta", text);
  }

  function answerFollowUp(id: number, answer: "no" | "si") {
    const item = thread.find((entry) => entry.kind === "followup" && entry.id === id);
    if (!item || item.kind !== "followup") return;
    const label = answer === "si" ? item.followUp.yes : item.followUp.no;
    setThread((items) => [
      ...items.map((entry) =>
        entry.kind === "followup" && entry.id === id ? { ...entry, answered: answer } : entry,
      ),
      { kind: "out-text" as const, id: Date.now(), text: label, time: nowTime() },
    ]);
    void askEscudoIA(null, "respuesta", label, { keepEvidence: true, alreadyActed: answer === "si" });
  }

  function answerFeedback(id: number, answer: "ok" | "mas") {
    const label = answer === "ok" ? "✅ Sí, me fue útil" : "❓ Necesito una explicación adicional";
    setThread((items) => [
      ...items.map((entry) =>
        entry.kind === "feedback" && entry.id === id ? { ...entry, answered: answer } : entry,
      ),
      { kind: "out-text" as const, id: Date.now(), text: label, time: nowTime() },
    ]);
    if (answer === "ok") {
      const closing = buildClosingMessage(lastEarnedRef.current);
      lastEarnedRef.current = null;
      historyRef.current.push({ role: "user", content: label });
      historyRef.current.push({ role: "assistant", content: closing });
      window.setTimeout(() => {
        setThread((items) => [
          ...items,
          { kind: "reply" as const, id: Date.now(), text: closing, time: nowTime() },
        ]);
      }, 500);
      return;
    }
    void askEscudoIA(
      null,
      "consulta",
      "No terminé de entender su respuesta anterior. Explíquemelo de nuevo, con palabras aún más sencillas y un ejemplo cotidiano completo, sin repetir el mismo texto. Desarrolle la explicación entre 80 y 180 palabras, con inicio, desarrollo y cierre, y termine el ejemplo antes de finalizar.",
      { keepEvidence: true },
    );
  }

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsCameraSheetOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      setLiveCamera(stream);
    } catch {
      setIsCameraSheetOpen(true);
    }
  }

  function closeCamera() {
    liveCamera?.getTracks().forEach((track) => track.stop());
    setLiveCamera(null);
  }

  function handleCapture(file: File) {
    closeCamera();
    if (attachment?.url) URL.revokeObjectURL(attachment.url);
    setAttachment({ file, url: URL.createObjectURL(file) });
  }

  async function startRecording() {
    setError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Su navegador no permite grabar audio.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Necesitamos permiso para usar el micrófono.");
      return;
    }
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    cancelledRef.current = false;
    const startedAt = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setElapsed(0);
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      if (cancelledRef.current) return;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      if (blob.size < 1024) {
        setError("La grabación fue demasiado corta. Inténtelo de nuevo.");
        return;
      }
      setThread((items) => [
        ...items,
        { kind: "voice", id: Date.now(), url: URL.createObjectURL(blob), seconds, time: nowTime() },
      ]);
      void askEscudoIA(blob);
    };

    recorder.start();
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
  }

  function stopRecording(cancel: boolean) {
    cancelledRef.current = cancel;
    recorderRef.current?.stop();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col bg-wa-chat-bg shadow-xl">
      <header className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-wa-header px-3 py-2.5 sm:flex sm:gap-3 text-wa-header-foreground">
        
        <Button variant="chat" size="chat"
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Ver el perfil de QIA"
        >
          <img
            src={qreoAvatar.url}
            alt="Logo de Qreo: isotipo inspirado en el frailejón arbóreo de Nariño"
            width={512}
            height={512}
            className="size-10 shrink-0 rounded-full object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate text-[17px] font-semibold leading-tight">
              QIA
              <VerifiedBadge className="size-4 shrink-0 text-wa-verified" />
              <span className="sr-only">Cuenta verificada</span>
            </span>
            <span className="block whitespace-normal text-[12.5px] leading-relaxed">
              Cuenta oficial verificada de Qreo · en línea
            </span>
          </span>
        </Button>
        <Video className="pointer-events-none hidden size-5 sm:block shrink-0 text-wa-header-foreground/35" aria-hidden="true" />
        <Phone className="pointer-events-none hidden size-5 sm:block shrink-0 text-wa-header-foreground/35" aria-hidden="true" />
        <Link
          to="/escudocoins"
          aria-label="Mis EscudoCoins"
          className="shrink-0 rounded-full p-1 opacity-90 transition-opacity active:opacity-70"
        >
          <Coins className="size-5" aria-hidden="true" />
        </Link>
      </header>

      <nav className="sticky top-[84px] z-10 border-b border-wa-send/20 bg-wa-composer px-3 py-2 text-wa-bubble-in-foreground">
        <Button asChild variant="chat" size="chat" className="min-h-11 justify-start gap-2 text-[16px] font-semibold text-wa-header">
          <Link to="/"><ArrowLeft aria-hidden="true" />Volver al menú principal</Link>
        </Button>
        <h1 className="px-2 pb-1 text-[16px] font-semibold">{topic}</h1>
      </nav>
      <main className="flex flex-1 flex-col gap-2 px-3 py-4">
        {children}
        {thread.map((item) => {
          if (item.kind === "voice") return (
            <VoiceNoteBubble key={item.id} url={item.url} seconds={item.seconds} time={item.time} />
          );
          if (item.kind === "out-text") return (
            <OutgoingTextBubble key={item.id} text={item.text} time={item.time} />
          );
          if (item.kind === "out-image") return (
            <OutgoingImageBubble key={item.id} url={item.url} name={item.name} time={item.time} />
          );
          if (item.kind === "out-file") return (
            <OutgoingFileBubble key={item.id} name={item.name} size={item.size} time={item.time} />
          );
          if (item.kind === "followup") return (
            <FollowUpBubble
              key={item.id}
              time={item.time}
              followUp={item.followUp}
              answered={item.answered}
              onAnswer={(answer) => answerFollowUp(item.id, answer)}
            />
          );
          if (item.kind === "feedback") return (
            <FeedbackBubble
              key={item.id}
              time={item.time}
              answered={item.answered}
              onAnswer={(answer) => answerFeedback(item.id, answer)}
            />
          );
          if (item.kind === "verdict") return (
            <VerdictBubble
              key={item.id}
              text={item.text}
              time={item.time}
              risk={item.risk}
              advisor={item.advisor}
              alert={item.alert}
              onShare={handleShareAlert}
            />
          );
          return (
            <IncomingBubble key={item.id} time={item.time}>
              {item.text.split("\n").filter(Boolean).map((line, index) => (
                <p key={index} className={index === 0 ? undefined : "mt-3"}>
                  {line}
                </p>
              ))}
            </IncomingBubble>
          );
        })}
        {isThinking ? <TypingBubble status={ANALYSIS_STEPS[statusStep]} /> : null}
        {reward ? (
          <CoinRewardCard key={reward.id} reward={reward} onClose={() => setReward(null)} />
        ) : null}
        <div ref={bottomRef} />
      </main>

      <div className="escudo-composer sticky bottom-0 z-10 bg-wa-chat-bg px-2 pb-3 pt-1">
        {error ? (
          <p role="status" className="px-2 pb-1.5 text-[12.5px] text-destructive">
            {error}
          </p>
        ) : null}
        {attachment ? (
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-wa-composer px-3 py-2.5 shadow-[var(--shadow-bubble)]">
            {attachment.url ? (
              <img
                src={attachment.url}
                alt={`Vista previa de ${attachment.file.name}`}
                className="size-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-wa-send/10 text-wa-send">
                {attachment.file.type.startsWith("audio/") ? (
                  <Headphones className="size-6" aria-hidden="true" />
                ) : (
                  <FileText className="size-6" aria-hidden="true" />
                )}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] text-wa-bubble-in-foreground">
                {attachment.file.name || "archivo adjunto"}
              </span>
              <span className="block text-[12.5px] text-muted-foreground">
                Escriba abajo su pregunta (opcional) y pulse enviar
              </span>
            </span>
            <Button variant="chat" size="chat"
              type="button"
              onClick={() => {
                if (attachment.url) URL.revokeObjectURL(attachment.url);
                setAttachment(null);
              }}
              aria-label="Quitar el archivo adjunto"
              className="shrink-0 rounded-full p-1 text-muted-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          {isRecording ? (
            <div className="flex flex-1 items-center gap-3 rounded-3xl bg-wa-composer px-3 py-2.5 shadow-[var(--shadow-bubble)]">
              <Button variant="chat" size="chat"
                type="button"
                onClick={() => stopRecording(true)}
                aria-label="Cancelar grabación"
                className="shrink-0 text-muted-foreground"
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </Button>
              <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-destructive" aria-hidden="true" />
              <span className="flex-1 text-[16px] tabular-nums text-wa-bubble-in-foreground">
                {formatDuration(elapsed)}
              </span>
              <span className="text-[13px] text-muted-foreground">Grabando…</span>
            </div>
          ) : (
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_44px_44px] items-center gap-2 rounded-3xl bg-wa-composer px-3 py-2.5 sm:flex shadow-[var(--shadow-bubble)]">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                aria-label="Escriba su pregunta o pegue el mensaje que recibió"
                placeholder={attachment ? "Añada una pregunta (opcional)" : "Escriba su pregunta aquí"}
                className="col-span-3 min-w-0 w-full flex-1 bg-transparent text-[16px] text-wa-bubble-in-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button variant="chat" size="chat"
                type="button"
                onClick={() => attachInputRef.current?.click()}
                aria-label="Adjuntar archivo, imagen, documento o audio"
                className="col-start-2 shrink-0 rounded-full p-1 text-muted-foreground transition-colors active:bg-wa-send/10"
              >
                <Paperclip className="size-5" aria-hidden="true" />
              </Button>
              <Button variant="chat" size="chat"
                type="button"
                onClick={() => void openCamera()}
                aria-label="Tomar una foto con la cámara"
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors active:bg-wa-send/10"
              >
                <Camera className="size-5" aria-hidden="true" />
              </Button>
            </div>
          )}
          <input
            ref={attachInputRef}
            type="file"
            accept="image/*,audio/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            className="hidden"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              setIsCameraSheetOpen(false);
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              setIsCameraSheetOpen(false);
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <Button variant="chat" size="chat"
            type="button"
            onClick={() => {
              if (isRecording) return stopRecording(false);
              if (attachment || draft.trim()) return sendMessage();
              return startRecording();
            }}
            aria-label={
              isRecording || attachment || draft.trim() ? "Enviar mensaje" : "Grabar nota de voz"
            }
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-wa-send text-wa-header-foreground transition-transform active:scale-95"
          >
            {isRecording || attachment || draft.trim() ? (
              <Send className="size-5" aria-hidden="true" />
            ) : (
              <Mic className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {liveCamera ? <CameraCapture stream={liveCamera} onCapture={handleCapture} onClose={closeCamera} /> : null}
      {isCameraSheetOpen ? (
        <CameraOptionsSheet
          onClose={() => setIsCameraSheetOpen(false)}
          onTakePhoto={() => cameraInputRef.current?.click()}
          onPickGallery={() => galleryInputRef.current?.click()}
        />
      ) : null}
      {isProfileOpen ? <ProfileScreen onClose={() => setIsProfileOpen(false)} /> : null}
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function VoiceNoteBubble({ url, seconds, time }: { url: string; seconds: number; time: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="max-w-[88%] self-end rounded-2xl rounded-tr-sm bg-wa-bubble-out px-3 py-2.5 text-wa-bubble-out-foreground shadow-[var(--shadow-bubble)]">
      <div className="flex items-center gap-3">
        <Button variant="chat" size="chat"
          type="button"
          aria-label={isPlaying ? "Pausar nota de voz" : "Reproducir nota de voz"}
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) void audio.play();
            else audio.pause();
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-wa-send text-wa-header-foreground"
        >
          {isPlaying ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </Button>
        <div className="flex flex-1 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, index) => (
            <span
              key={index}
              className="w-[3px] rounded-full bg-wa-bubble-out-foreground/40"
              style={{ height: `${6 + ((index * 7) % 16)}px` }}
            />
          ))}
        </div>
        <span className="shrink-0 text-[12.5px] tabular-nums text-wa-bubble-out-foreground/70">
          {formatDuration(seconds)}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <span className="mt-1 block text-right text-[11.5px] text-wa-bubble-out-foreground/70">{time}</span>
    </div>
  );
}

export function IncomingBubble({ children, time }: { children: ReactNode; time: string }) {
  return (
    <div className="max-w-[88%] self-start rounded-2xl rounded-tl-sm bg-wa-bubble-in px-3.5 py-2.5 text-[16.5px] leading-relaxed text-wa-bubble-in-foreground shadow-[var(--shadow-bubble)]">
      {children}
      <span className="mt-1 block text-right text-[11.5px] text-muted-foreground">{time}</span>
    </div>
  );
}

function OutgoingTextBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="max-w-[88%] self-end rounded-2xl rounded-tr-sm bg-wa-bubble-out px-3.5 py-2.5 text-[16.5px] leading-relaxed text-wa-bubble-out-foreground shadow-[var(--shadow-bubble)]">
      {text}
      <span className="mt-1 block text-right text-[11.5px] text-wa-bubble-out-foreground/70">{time}</span>
    </div>
  );
}

function OutgoingImageBubble({ url, name, time }: { url: string; name: string; time: string }) {
  return (
    <div className="max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-wa-bubble-out p-1.5 text-wa-bubble-out-foreground shadow-[var(--shadow-bubble)]">
      <img src={url} alt={`Imagen enviada: ${name}`} className="max-h-64 w-full rounded-xl object-cover" />
      <span className="mt-1 block pr-1 text-right text-[11.5px] text-wa-bubble-out-foreground/70">{time}</span>
    </div>
  );
}

function OutgoingFileBubble({ name, size, time }: { name: string; size: number; time: string }) {
  return (
    <div className="max-w-[88%] self-end rounded-2xl rounded-tr-sm bg-wa-bubble-out px-3 py-2.5 text-wa-bubble-out-foreground shadow-[var(--shadow-bubble)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-wa-send text-wa-header-foreground">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15.5px] font-medium">{name}</span>
          <span className="block text-[12.5px] text-wa-bubble-out-foreground/70">
            {(size / 1024 < 1024
              ? `${Math.max(1, Math.round(size / 1024))} KB`
              : `${(size / 1024 / 1024).toFixed(1)} MB`)}
          </span>
        </span>
      </div>
      <span className="mt-1 block text-right text-[11.5px] text-wa-bubble-out-foreground/70">{time}</span>
    </div>
  );
}

function ChoiceButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="chat" size="chat"
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl border border-wa-send/30 bg-wa-composer px-4 py-3 text-center text-[16px] font-medium leading-snug text-wa-send transition-colors disabled:opacity-50 active:bg-wa-send/10"
    >
      {children}
    </Button>
  );
}

/** Pregunta de seguimiento contextual: el texto y las opciones los define el asistente. */
function FollowUpBubble({
  time,
  followUp,
  answered,
  onAnswer,
}: {
  time: string;
  followUp: FollowUp;
  answered: null | "no" | "si";
  onAnswer: (answer: "no" | "si") => void;
}) {
  return (
    <div className="max-w-[92%] self-start rounded-2xl rounded-tl-sm bg-wa-bubble-in px-3.5 py-3 text-wa-bubble-in-foreground shadow-[var(--shadow-bubble)]">
      <p className="text-[16.5px] leading-relaxed">{followUp.question}</p>
      <div className="mt-3 flex flex-col gap-2">
        <ChoiceButton disabled={answered !== null} onClick={() => onAnswer("no")}>
          {followUp.no}
        </ChoiceButton>
        <ChoiceButton disabled={answered !== null} onClick={() => onAnswer("si")}>
          {followUp.yes}
        </ChoiceButton>
      </div>
      <span className="mt-1.5 block text-right text-[11.5px] text-muted-foreground">{time}</span>
    </div>
  );
}

/** Confirmación de comprensión: la conversación no termina hasta que la duda quede resuelta. */
function FeedbackBubble({
  time,
  answered,
  onAnswer,
}: {
  time: string;
  answered: null | "ok" | "mas";
  onAnswer: (answer: "ok" | "mas") => void;
}) {
  return (
    <div className="max-w-[92%] self-start rounded-2xl rounded-tl-sm bg-wa-bubble-in px-3.5 py-3 text-wa-bubble-in-foreground shadow-[var(--shadow-bubble)]">
      <p className="text-[16.5px] leading-relaxed">¿Esta información resolvió su duda?</p>
      <div className="mt-3 flex flex-col gap-2">
        <ChoiceButton disabled={answered !== null} onClick={() => onAnswer("ok")}>
          ✅ Sí, me fue útil
        </ChoiceButton>
        <ChoiceButton disabled={answered !== null} onClick={() => onAnswer("mas")}>
          ❓ Necesito una explicación adicional
        </ChoiceButton>
      </div>
      <span className="mt-1.5 block text-right text-[11.5px] text-muted-foreground">{time}</span>
    </div>
  );
}

function TypingBubble({ status }: { status?: string }) {
  return (
    <div
      role="status"
      aria-label={status ?? "QIA está escribiendo"}
      className="flex max-w-[88%] items-center gap-2.5 self-start rounded-2xl rounded-tl-sm bg-wa-bubble-in px-4 py-3 shadow-[var(--shadow-bubble)]"
    >
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </span>
      {status ? (
        <span className="text-[14.5px] leading-snug text-muted-foreground">{status}</span>
      ) : null}
    </div>
  );
}

/** Captura en vivo dentro de la app: la foto se adjunta y se analiza sola. */
function CameraCapture({
  stream,
  onCapture,
  onClose,
}: {
  stream: MediaStream;
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [stream]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1440;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-camera-surface">
      <video ref={videoRef} playsInline muted className="min-h-0 flex-1 object-cover" />
      <div className="flex items-center justify-between px-8 py-6">
        <Button variant="chat" size="chat"
          type="button"
          onClick={onClose}
          aria-label="Cerrar la cámara"
          className="rounded-full p-3 text-camera-foreground"
        >
          <X className="size-6" aria-hidden="true" />
        </Button>
        <Button variant="chat" size="chat"
          type="button"
          onClick={takePhoto}
          aria-label="Tomar la fotografía"
          className="size-16 rounded-full border-4 border-camera-foreground bg-camera-foreground/20 transition-transform active:scale-95"
        />
        <span className="size-12" aria-hidden="true" />
      </div>
    </div>
  );
}

function CameraOptionsSheet({
  onClose,
  onTakePhoto,
  onPickGallery,
}: {
  onClose: () => void;
  onTakePhoto: () => void;
  onPickGallery: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Opciones de imagen"
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[24rem] rounded-3xl bg-wa-bubble-in p-4 text-wa-bubble-in-foreground shadow-2xl">
        <p className="px-2 pb-3 text-[15px] text-muted-foreground">
          ¿Cómo quiere enviar la imagen?
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="chat" size="chat"
            type="button"
            onClick={onTakePhoto}
            className="flex items-center gap-3 rounded-2xl bg-wa-composer px-4 py-3.5 text-[16px] font-medium"
          >
            <Camera className="size-5 text-wa-send" aria-hidden="true" />
            Tomar fotografía
          </Button>
          <Button variant="chat" size="chat"
            type="button"
            onClick={onPickGallery}
            className="flex items-center gap-3 rounded-2xl bg-wa-composer px-4 py-3.5 text-[16px] font-medium"
          >
            <ImageIcon className="size-5 text-wa-send" aria-hidden="true" />
            Elegir de la galería
          </Button>
          <Button variant="chat" size="chat"
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-3 text-[16px] text-muted-foreground"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Perfil del contacto, al estilo de una cuenta de WhatsApp Business (solo visual). */
function ProfileScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-wa-chat-bg">
      <div className="mx-auto w-full max-w-[26rem] pb-10">
        <div className="sticky top-0 flex items-center gap-3 bg-wa-header px-3 py-3 text-wa-header-foreground">
          <Button variant="chat" size="chat" type="button" onClick={onClose} aria-label="Volver al chat" className="p-1">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
          <span className="text-[16px] font-medium">Información del contacto</span>
        </div>

        <div className="flex flex-col items-center gap-2 bg-wa-bubble-in px-4 py-7 text-center">
          <img
            src={qreoAvatar.url}
            alt="Logo de Qreo"
            width={512}
            height={512}
            className="size-28 rounded-full object-cover"
          />
          <h2 className="mt-2 flex items-center gap-1.5 text-[22px] font-semibold text-wa-bubble-in-foreground">
            QIA
            <VerifiedBadge className="size-5 text-wa-verified" />
          </h2>
          <p className="text-[15px] text-muted-foreground">Cuenta oficial verificada de Qreo</p>
          <p className="text-[15px] text-muted-foreground">Asistente de protección digital</p>
        </div>

        <section className="mt-3 bg-wa-bubble-in px-4 py-4 text-wa-bubble-in-foreground">
          <h3 className="text-[13.5px] font-semibold uppercase tracking-wide text-wa-send">Descripción</h3>
          <p className="mt-2 text-[15.5px] leading-relaxed">
            QIA ayuda a prevenir situaciones de fraude digital mediante el análisis de enlaces,
            mensajes, correos electrónicos, imágenes, códigos QR y notas de voz.
          </p>
          <p className="mt-2 text-[15.5px] leading-relaxed">
            También responde preguntas relacionadas con prevención del fraude y uso responsable del dinero.
          </p>
          <p className="mt-3 text-[15.5px] font-medium">Nunca solicitará:</p>
          <ul className="mt-1 space-y-1 text-[15.5px] leading-relaxed">
            <li>• Contraseñas</li>
            <li>• Códigos OTP</li>
            <li>• Claves bancarias</li>
            <li>• Información de tarjetas</li>
          </ul>
        </section>

        <section className="mt-3 bg-wa-bubble-in px-4 py-4 text-wa-bubble-in-foreground">
          <h3 className="text-[13.5px] font-semibold uppercase tracking-wide text-wa-send">Estado</h3>
          <p className="mt-1.5 flex items-center gap-2 text-[15.5px]">
            <ShieldCheck className="size-5 text-wa-verified" aria-hidden="true" />
            Cuenta oficial verificada
          </p>
          <h3 className="mt-4 text-[13.5px] font-semibold uppercase tracking-wide text-wa-send">
            Disponibilidad
          </h3>
          <p className="mt-1.5 text-[15.5px]">Disponible 24 horas</p>
        </section>

        <section className="mt-3 bg-wa-bubble-in px-2 py-2 text-wa-bubble-in-foreground">
          {["Compartir contacto", "Agregar a favoritos", "Bloquear", "Reportar contacto"].map((label) => (
            <p
              key={label}
              className={`px-3 py-3.5 text-[16px] ${
                label === "Bloquear" || label === "Reportar contacto"
                  ? "text-destructive"
                  : "text-wa-bubble-in-foreground"
              }`}
            >
              {label}
            </p>
          ))}
        </section>
      </div>
    </div>
  );
}

function CallConfirmationDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[22rem] overflow-hidden rounded-3xl bg-wa-bubble-in p-6 text-wa-bubble-in-foreground shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-wa-send/10 text-wa-send">
            <Phone className="size-6" aria-hidden="true" />
          </div>
          <Button variant="chat" size="chat"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 text-muted-foreground transition-colors active:bg-wa-composer"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <h2 id="call-dialog-title" className="text-[18px] font-bold leading-snug text-wa-bubble-in-foreground">
          ¿Llamar a un asesor de Qreo?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Tienes un caso que requiere acompañamiento de un asesor de Qreo.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          ¿Deseas llamar ahora a nuestra línea de atención?
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Las llamadas telefónicas solo están disponibles cuando accedes desde un dispositivo móvil. Si estás en un computador, comunícate con Qreo a través de nuestros canales oficiales.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="tel:+573167546030"
            aria-label="Llamar ahora a Qreo al número +57 316 754 6030"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wa-send px-4 py-3.5 text-[16px] font-semibold text-wa-header-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <Phone className="size-5" aria-hidden="true" />
            Llamar ahora
          </a>
          <Button variant="chat" size="chat"
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-wa-composer px-4 py-3.5 text-[16px] font-medium text-wa-bubble-in-foreground transition-colors active:bg-wa-composer/80"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function VerdictBubble({
  text,
  time,
  risk,
  advisor,
  alert,
  onShare,
}: {
  text: string;
  time: string;
  risk: Risk;
  advisor: boolean;
  alert: ShareAlert | null;
  onShare: (alert: ShareAlert) => void | Promise<void>;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const canShare = (risk === "yellow" || risk === "red") && alert !== null;
  const lines = text.split("\n").filter((line) => line.trim());
  const [first, ...rest] = lines;
  const hasSemaphore = /🔴|🟡|🟢/.test(first ?? "");
  const style =
    risk === "red"
      ? { color: "text-risk-high", bg: "bg-risk-high/10", label: "Riesgo alto" }
      : risk === "yellow"
        ? { color: "text-risk-medium", bg: "bg-risk-medium/15", label: "No está claro" }
        : risk === "green"
          ? { color: "text-risk-low", bg: "bg-risk-low/10", label: "Parece seguro" }
          : null;

  return (
    <>
      <div className="max-w-[92%] self-start rounded-2xl rounded-tl-sm bg-wa-bubble-in px-3.5 py-3 text-[16.5px] leading-relaxed text-wa-bubble-in-foreground shadow-[var(--shadow-bubble)]">
        {first ? (
          hasSemaphore && style ? (
            <p className={`rounded-xl px-3 py-2 text-[17px] font-semibold ${style.bg} ${style.color}`}>
              {first}
              <span className="sr-only"> — {style.label}</span>
            </p>
          ) : (
            <p>{first}</p>
          )
        ) : null}
        {rest.map((line, index) => (
          <p key={index} className="mt-3">
            {line}
          </p>
        ))}
        {advisor ? (
          <Button variant="chat" size="chat"
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-wa-send/30 bg-wa-composer px-4 py-3 text-center text-[16px] font-medium leading-snug text-wa-send active:bg-wa-send/10"
          >
            <Headphones className="size-5 shrink-0" aria-hidden="true" />
            Llamar a un asesor de Qreo
          </Button>
        ) : null}
        {canShare ? (
          <Button variant="chat" size="chat"
            type="button"
            disabled={isSharing}
            onClick={async () => {
              setIsSharing(true);
              try {
                if (!alert) return;
                await onShare(alert);
              } finally {
                setIsSharing(false);
              }
            }}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-wa-send/30 bg-wa-composer px-4 py-3 text-center text-[16px] font-medium leading-snug text-wa-send active:bg-wa-send/10 disabled:opacity-60"
          >
            <Share2 className="size-5 shrink-0" aria-hidden="true" />
            Compartir esta alerta
          </Button>
        ) : null}
        <span className="mt-1.5 block text-right text-[11.5px] text-muted-foreground">{time}</span>
      </div>
      {advisor ? (
        <CallConfirmationDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      ) : null}
    </>
  );
}

export function SystemNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[92%] rounded-lg bg-wa-composer px-3 py-2 text-center text-[13px] leading-snug text-muted-foreground shadow-[var(--shadow-bubble)]">
      <Plus className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
      {children}
    </div>
  );
}