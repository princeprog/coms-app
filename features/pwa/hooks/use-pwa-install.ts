"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [available, setAvailable] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setAvailable(
        !media.matches &&
          !(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = () => {
      setAvailable(false);
      setPrompt(null);
      setInstructions(null);
    };
    // Browser capability is determined after hydration.
    queueMicrotask(update);
    media.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = async () => {
    if (!prompt) {
      setInstructions(
        "Open your browser menu and choose Install app or Add to Home Screen. On iPhone or iPad, use Safari's Share menu.",
      );
      return;
    }
    setInstalling(true);
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === "accepted") setAvailable(false);
      setPrompt(null);
    } catch {
      setInstructions(
        "Installation could not start. Try Install app from your browser menu.",
      );
    } finally {
      setInstalling(false);
    }
  };
  return { available, instructions, install, installing };
}
