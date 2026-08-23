import { createServerFn } from "@tanstack/react-start";
import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";
import { z } from "zod";

const tokenRequestSchema = z.object({
  roomName: z.string().optional().default("factory-floor"),
  participantName: z.string().optional().default("Factory Operator"),
});

/**
 * Server function to generate a LiveKit participant token automatically
 * from the backend environment variables without prompting the user.
 */
export const getLiveKitToken = createServerFn({ method: "POST" })
  .validator((data: unknown) => tokenRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const livekitUrl =
      process.env["LIVEKIT_URL"] ||
      process.env["VITE_LIVEKIT_URL"] ||
      "";
    const apiKey = process.env["LIVEKIT_API_KEY"] || "";
    const apiSecret = process.env["LIVEKIT_API_SECRET"] || "";

    if (!livekitUrl || !apiKey || !apiSecret) {
      return {
        success: false,
        error:
          "LiveKit credentials missing in .env! Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.",
        url: null,
        token: null,
      };
    }

    try {
      const roomName = data.roomName || "factory-floor";
      const identity = `operator-${Math.floor(1000 + Math.random() * 9000)}`;

      // Automatically dispatch the Voice AI agent to this room if not already running
      try {
        const httpUrl = livekitUrl.replace("wss://", "https://").replace("ws://", "http://");
        const dispatchClient = new AgentDispatchClient(httpUrl, apiKey, apiSecret);
        await dispatchClient.createDispatch(roomName, "");
      } catch (dispatchErr) {
        // Safe to ignore if already dispatched
      }

      const at = new AccessToken(apiKey, apiSecret, {
        identity,
        name: data.participantName || "Factory Operator",
        ttl: "6h",
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();

      return {
        success: true,
        url: livekitUrl,
        token,
        roomName,
        identity,
      };
    } catch (err: any) {
      console.error("Failed to mint LiveKit JWT token:", err);
      return {
        success: false,
        error: err?.message || "Failed to generate LiveKit room token",
        url: null,
        token: null,
      };
    }
  });

/**
 * Diagnostic server function to verify backend LiveKit & Gemini credentials
 */
export const checkLiveKitStatus = createServerFn({ method: "GET" }).handler(async () => {
  const livekitUrl = process.env["LIVEKIT_URL"] || "";
  const apiKey = process.env["LIVEKIT_API_KEY"] || "";
  const apiSecret = process.env["LIVEKIT_API_SECRET"] || "";
  const geminiKey = process.env["GEMINI_API_KEY"] || "";
  const geminiModel = process.env["GEMINI_MODEL"] || "gemini-2.5-flash-native-audio-preview-12-2025";

  const hasLiveKit = Boolean(livekitUrl && apiKey && apiSecret);
  const hasGemini = Boolean(geminiKey);

  return {
    livekitConfigured: hasLiveKit,
    geminiConfigured: hasGemini,
    livekitUrl: livekitUrl ? livekitUrl.substring(0, 15) + "..." : "Not configured",
    hasApiKey: Boolean(apiKey),
    hasApiSecret: Boolean(apiSecret),
    geminiModel,
    status: hasLiveKit && hasGemini ? "READY" : "MISSING_CREDENTIALS",
    message: !hasLiveKit
      ? "LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET missing in .env"
      : !hasGemini
      ? "GEMINI_API_KEY missing in .env"
      : "Backend is fully configured with LiveKit and Gemini Live!",
  };
});
