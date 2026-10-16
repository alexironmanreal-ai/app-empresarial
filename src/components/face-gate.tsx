import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@/lib/accounts";
import {
  cameraSupported,
  captureTemplateFromVideo,
  clearFaceEnroll,
  detectFacesInVideo,
  enrollFace,
  getFaceEnroll,
  isFaceUnlocked,
  markFaceUnlocked,
  verifyAgainstEnroll,
} from "@/lib/face-auth";
import { Button } from "./ui/button";
import { Camera, ShieldCheck, RefreshCw, UserRound } from "lucide-react";

type Phase = "boot" | "enroll" | "verify" | "done";

export function FaceGate({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("Iniciando cámara…");
  const [faces, setFaces] = useState(0);
  const [native, setNative] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    if (!cameraSupported()) {
      setError("Este dispositivo no expone cámara (getUserMedia).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setHint("Centrá tu cara en el óvalo");
    } catch (e) {
      const err = e as Error & { name?: string };
      setError(
        err?.name === "NotAllowedError" || (err?.message || "").includes("Permission")
          ? "Permiso de cámara denegado. Habilitalo en el navegador / sistema."
          : err?.message || "No se pudo abrir la cámara",
      );
    }
  }, []);

  useEffect(() => {
    if (isFaceUnlocked(session.userId)) {
      setPhase("done");
      return;
    }
    const enrolled = getFaceEnroll(session.userId);
    setPhase(enrolled ? "verify" : "enroll");
  }, [session.userId]);

  useEffect(() => {
    if (phase !== "enroll" && phase !== "verify") return;
    void startCamera();
    return () => stopCamera();
  }, [phase, startCamera, stopCamera]);

  useEffect(() => {
    if (phase !== "enroll" && phase !== "verify") return;
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const r = await detectFacesInVideo(video);
        if (alive) {
          setFaces(r.faces);
          setNative(r.native);
        }
      }
      rafRef.current = requestAnimationFrame(() => {
        void tick();
      });
    };
    void tick();
    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  async function onCapture() {
    setError("");
    setScore(null);
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    try {
      const det = await detectFacesInVideo(video);
      if (det.faces < 1) {
        setError("No se detectó un rostro. Mejorá la luz y centrate en el óvalo.");
        return;
      }
      const tpl = captureTemplateFromVideo(video);
      if (!tpl) {
        setError("No se pudo capturar el frame.");
        return;
      }

      if (phase === "enroll") {
        enrollFace(session.userId, tpl);
        stopCamera();
        setPhase("done");
        return;
      }

      const enrolled = getFaceEnroll(session.userId);
      if (!enrolled) {
        setPhase("enroll");
        return;
      }
      const match = verifyAgainstEnroll(enrolled, tpl);
      setScore(match.score);
      if (!match.ok) {
        setError(
          `Rostro no coincide (similitud ${(match.score * 100).toFixed(0)}%). Probá de nuevo con la misma iluminación.`,
        );
        return;
      }
      markFaceUnlocked(session.userId);
      stopCamera();
      setPhase("done");
    } finally {
      setBusy(false);
    }
  }

  function onResetEnroll() {
    clearFaceEnroll(session.userId);
    setScore(null);
    setError("");
    setPhase("enroll");
  }

  if (phase === "boot") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="font-mono text-sm">Preparando verificación facial…</p>
      </div>
    );
  }

  if (phase === "done") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/15 p-2 text-accent">
            <UserRound className="size-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
              Post-login
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl">
              {phase === "enroll" ? "Registrar rostro" : "Verificación facial"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {phase === "enroll"
                ? "Primera vez en este dispositivo: guardamos una plantilla local (no se sube a la nube)."
                : `Hola ${session.displayName}: confirmá que sos vos con la cámara.`}
            </p>
          </div>
        </div>

        <div className="relative mx-auto mt-5 aspect-square w-full max-w-[280px] overflow-hidden rounded-full bg-elevated shadow-[var(--shadow-border)]">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <div
            className={`pointer-events-none absolute inset-4 rounded-full border-2 ${
              faces > 0 ? "border-ok" : "border-border"
            }`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-subtle">
          <span>
            Rostros:{" "}
            <strong className={faces > 0 ? "text-ok" : "text-warn"}>{faces}</strong>
          </span>
          <span>{native ? "detector nativo" : "detector básico"}</span>
          {score !== null ? <span>match {(score * 100).toFixed(0)}%</span> : null}
        </div>
        <p className="mt-1 text-center text-xs text-muted">{hint}</p>

        {error ? (
          <p className="mt-3 rounded-md bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          <Button className="w-full" disabled={busy || faces < 1} onClick={() => void onCapture()}>
            {phase === "enroll" ? (
              <>
                <Camera className="size-4" />
                {busy ? "Guardando…" : "Enrolar este rostro"}
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                {busy ? "Verificando…" : "Verificar y entrar"}
              </>
            )}
          </Button>

          {phase === "verify" ? (
            <Button type="button" variant="secondary" className="w-full" onClick={onResetEnroll}>
              <RefreshCw className="size-4" />
              Re-enrolar rostro en este dispositivo
            </Button>
          ) : null}
        </div>

        <p className="mt-4 font-mono text-[10px] leading-relaxed text-subtle">
          La plantilla queda solo en este equipo (localStorage). Tras verificar, la sesión
          facial dura ~2 h en esta pestaña. En Electron/Linux puede hacer falta permiso de
          cámara del sistema.
        </p>
      </div>
    </div>
  );
}
