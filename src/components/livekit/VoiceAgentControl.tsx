import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneCall, PhoneOff, Radio, Sparkles, AlertCircle } from "lucide-react";
import { useLiveKitStore } from "@/lib/livekitClient";
import { checkLiveKitStatus } from "@/lib/livekit.functions";

export function VoiceAgentControl() {
  const {
    status,
    isMicMuted,
    isAgentSpeaking,
    errorMessage,
    lastKpiSentAt,
    connect,
    disconnect,
    toggleMic,
  } = useLiveKitStore();

  const [backendCheck, setBackendCheck] = useState<{
    livekitConfigured: boolean;
    geminiConfigured: boolean;
    message: string;
  } | null>(null);

  // Check backend status on mount
  useEffect(() => {
    checkLiveKitStatus()
      .then((res) => setBackendCheck(res))
      .catch(() => {});
  }, [status]);

  const handleConnect = async () => {
    await connect();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur">
        {/* Status Animated Indicator */}
        <div className="flex items-center gap-1.5">
          {status === "connected" ? (
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
          ) : status === "connecting" ? (
            <span className="size-2.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : status === "error" ? (
            <span className="size-2.5 rounded-full bg-destructive" />
          ) : (
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
          )}

          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-tight flex items-center gap-1 text-foreground">
              <Sparkles className="size-3 text-accent" />
              Gemini 3.1 Live
            </p>
            <p className="text-[10px] text-muted-foreground">
              {status === "connected"
                ? isAgentSpeaking
                  ? "Speaking..."
                  : "Listening to factory floor"
                : status === "connecting"
                ? "Connecting WebRTC..."
                : status === "error"
                ? "Connection failed"
                : "Voice Agent Standby"}
            </p>
          </div>
        </div>

        {/* Live KPI Stream Indicator when Connected */}
        {status === "connected" && (
          <div className="hidden items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono text-accent lg:flex">
            <Radio className="size-2.5 animate-pulse text-accent" />
            <span>KPIs Stream Active</span>
          </div>
        )}

        {/* 1-Click Action Buttons */}
        {status === "connected" ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMic}
              aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              className={`inline-flex size-7 items-center justify-center rounded-lg border text-xs transition-colors ${
                isMicMuted
                  ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "border-border bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
              title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMicMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
            </button>

            <button
              onClick={disconnect}
              aria-label="Disconnect Voice Agent"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
              title="Disconnect Voice Agent"
            >
              <PhoneOff className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={status === "connecting"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <PhoneCall className="size-3.5" />
            <span>{status === "connecting" ? "Connecting..." : "Connect Voice"}</span>
          </button>
        )}
      </div>

      {/* Error Badge if .env credentials are missing */}
      {status === "error" && errorMessage && (
        <div className="flex items-center gap-1 text-[11px] text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-1 rounded-lg">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="truncate max-w-xs">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
