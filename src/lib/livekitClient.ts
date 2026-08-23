import { Room, RoomEvent, Track, TrackPublication, RemoteParticipant } from "livekit-client";
import { create } from "zustand";
import { getLiveKitToken } from "@/lib/livekit.functions";

export interface FactoryKpiPayload {
  timestamp: number;
  degradation: number;
  machines: Record<
    string,
    {
      name: string;
      output: number;
      cycleTime: number;
      vibration: number;
      temperature: number;
      power: number;
      health: number;
      status: string;
      online: boolean;
    }
  >;
  factory: {
    output: number;
    targetOutput: number;
    cycleTime: number;
    health: number;
    status: string;
  };
}

export type LiveKitConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface LiveKitState {
  status: LiveKitConnectionStatus;
  isMicMuted: boolean;
  isAgentSpeaking: boolean;
  activeRoomName: string | null;
  errorMessage: string | null;
  lastKpiSentAt: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMic: () => Promise<void>;
  broadcastKpis: (kpis: FactoryKpiPayload) => Promise<void>;
}

let activeRoom: Room | null = null;
const attachedAudioElements = new Set<HTMLAudioElement>();

function cleanupAudioElements() {
  attachedAudioElements.forEach((el) => {
    try {
      el.pause();
      el.srcObject = null;
      el.remove();
    } catch {
      /* ignore */
    }
  });
  attachedAudioElements.clear();
}

export const useLiveKitStore = create<LiveKitState>((set, get) => ({
  status: "disconnected",
  isMicMuted: false,
  isAgentSpeaking: false,
  activeRoomName: null,
  errorMessage: null,
  lastKpiSentAt: null,

  connect: async () => {
    try {
      set({ status: "connecting", errorMessage: null });
      console.log("[LiveKit] Requesting room token for 'factory-floor'...");

      // Automatically request token from backend using .env credentials
      const tokenRes = await getLiveKitToken({ data: { roomName: "factory-floor" } });

      if (!tokenRes.success || !tokenRes.token || !tokenRes.url) {
        const err =
          tokenRes.error ||
          "LiveKit credentials missing or invalid in .env (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)";
        console.error("[LiveKit] Token acquisition failed:", err);
        set({
          status: "error",
          errorMessage: err,
        });
        return;
      }

      console.log("[LiveKit] Token received. Connecting to LiveKit URL:", tokenRes.url);

      if (activeRoom) {
        await activeRoom.disconnect();
        cleanupAudioElements();
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Handle track subscriptions for AI Agent voice
      room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, publication: TrackPublication, participant: RemoteParticipant) => {
          console.log(
            `[LiveKit] Remote track subscribed: kind=${track.kind}, sid=${track.sid}, participant=${participant.identity}`
          );
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            el.volume = 1.0;
            document.body.appendChild(el);
            attachedAudioElements.add(el);
            el.play().catch((e) =>
              console.warn("[LiveKit] Browser audio playback policy warning:", e)
            );
          }
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track: Track) => {
          if (track.kind === Track.Kind.Audio) {
            console.log(`[LiveKit] Track unsubscribed: ${track.sid}`);
            track.detach().forEach((el) => {
              attachedAudioElements.delete(el);
              el.remove();
            });
          }
        }
      );

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log(`[LiveKit] Remote participant connected: ${participant.identity}`);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentSpeaking = speakers.some((s) => !s.isLocal);
        set({ isAgentSpeaking: agentSpeaking });
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log(`[LiveKit] Room disconnected: ${reason}`);
        cleanupAudioElements();
        set({ status: "disconnected", activeRoomName: null });
      });

      // Connect to LiveKit room
      await room.connect(tokenRes.url, tokenRes.token);
      console.log("[LiveKit] Successfully connected to room:", room.name);

      // Explicitly unlock browser audio context for WebRTC playback
      try {
        await room.startAudio();
        console.log("[LiveKit] Audio playback context unlocked successfully.");
      } catch (audioErr) {
        console.warn("[LiveKit] room.startAudio() notice:", audioErr);
      }

      // Enable local microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("[LiveKit] Local microphone published.");

      // Check and attach any pre-existing remote audio tracks
      for (const p of room.remoteParticipants.values()) {
        console.log(`[LiveKit] Found existing participant: ${p.identity}`);
        for (const pub of p.trackPublications.values()) {
          if (pub.track && pub.track.kind === Track.Kind.Audio) {
            const el = pub.track.attach();
            el.autoplay = true;
            el.volume = 1.0;
            document.body.appendChild(el);
            attachedAudioElements.add(el);
            el.play().catch((e) =>
              console.warn("[LiveKit] Existing audio track play notice:", e)
            );
            console.log(`[LiveKit] Attached existing audio track from ${p.identity}`);
          }
        }
      }

      activeRoom = room;
      set({
        status: "connected",
        activeRoomName: room.name || "factory-floor",
        isMicMuted: false,
        errorMessage: null,
      });
    } catch (err: any) {
      console.error("[LiveKit] Connection error:", err);
      set({
        status: "error",
        errorMessage: err?.message || "Failed to connect to Factory WebRTC room.",
      });
    }
  },

  disconnect: async () => {
    if (activeRoom) {
      console.log("[LiveKit] Disconnecting from room...");
      await activeRoom.disconnect();
      activeRoom = null;
      cleanupAudioElements();
    }
    set({ status: "disconnected", activeRoomName: null, isAgentSpeaking: false });
  },

  toggleMic: async () => {
    if (!activeRoom) return;
    const isMuted = !get().isMicMuted;
    await activeRoom.localParticipant.setMicrophoneEnabled(!isMuted);
    set({ isMicMuted: isMuted });
    console.log(`[LiveKit] Microphone ${isMuted ? "muted" : "unmuted"}`);
  },

  broadcastKpis: async (kpis: FactoryKpiPayload) => {
    if (!activeRoom || get().status !== "connected") return;

    try {
      // Ensure strictly sanitized KPI payload is transmitted
      const sanitized: FactoryKpiPayload = {
        timestamp: Date.now(),
        degradation: kpis.degradation,
        machines: kpis.machines,
        factory: kpis.factory,
      };

      const payloadString = JSON.stringify(sanitized);
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadString);

      await activeRoom.localParticipant.publishData(data, {
        reliable: true,
        topic: "factory_kpi_stream",
      });

      set({ lastKpiSentAt: Date.now() });
    } catch (err) {
      console.error("[LiveKit] Failed to broadcast factory KPIs over WebRTC:", err);
    }
  },
}));
