"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = "idle" | "requesting" | "live" | "denied" | "unsupported";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setError("Seu navegador não permite acesso à câmera.");
      return;
    }
    setState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setState("live");
    } catch {
      setState("denied");
      setError(
        "Não foi possível acessar a câmera. Permita o acesso nas configurações do navegador e tente de novo.",
      );
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, state, error, start, stop };
}
