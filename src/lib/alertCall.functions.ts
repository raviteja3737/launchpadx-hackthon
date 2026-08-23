import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SipClient, AgentDispatchClient } from "livekit-server-sdk";

const alertCallSchema = z.object({
  machineId: z.string().min(1).max(40),
  machineName: z.string().min(1).max(120),
  phoneNumber: z.string().optional(),
});

/**
 * Server function to trigger an automated outbound SIP alert call
 * when a machine is turned off or taken offline.
 */
export const triggerOutboundAlertCall = createServerFn({ method: "POST" })
  .validator((data: unknown) => alertCallSchema.parse(data))
  .handler(async ({ data }) => {
    const livekitUrl = process.env["LIVEKIT_URL"] || "";
    const apiKey = process.env["LIVEKIT_API_KEY"] || "";
    const apiSecret = process.env["LIVEKIT_API_SECRET"] || "";

    const sipHostname = process.env["SIP_TRUNK_HOSTNAME"] || "";
    const sipUsername = process.env["SIP_AUTH_USERNAME"] || "";
    const sipPassword = process.env["SIP_AUTH_PASSWORD"] || "";
    const sipFromNumber = process.env["SIP_FROM_NUMBER"] || "";
    const alertPhoneNumber = data.phoneNumber || process.env["ALERT_PHONE_NUMBER"] || "+916303219503";

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error("[ALERT CALL] LiveKit credentials missing in environment!");
      return {
        success: false,
        error: "LiveKit credentials missing (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)",
      };
    }

    if (!sipHostname || !sipUsername || !sipPassword || !sipFromNumber) {
      console.error("[ALERT CALL] SIP trunk credentials missing in environment!");
      return {
        success: false,
        error: "SIP trunk credentials missing (SIP_TRUNK_HOSTNAME, SIP_AUTH_USERNAME, SIP_AUTH_PASSWORD, SIP_FROM_NUMBER)",
      };
    }

    const roomName = `alert-${data.machineId}-${Math.random().toString(36).substring(2, 9)}`;
    const agentName = process.env["LIVEKIT_ALERT_AGENT_NAME"] || "outbound-alert-agent";
    const httpUrl = livekitUrl.replace("wss://", "https://").replace("ws://", "http://");

    console.log(`[ALERT CALL] Initiating outbound alert for ${data.machineName} (${data.machineId}) -> ${alertPhoneNumber}`);

    try {
      // Step 1: Dispatch the outbound alert agent to the room with metadata
      const dispatchClient = new AgentDispatchClient(httpUrl, apiKey, apiSecret);
      const metadata = JSON.stringify({
        machine_id: data.machineId,
        machine_name: data.machineName,
        phone_number: alertPhoneNumber,
      });

      console.log(`[ALERT CALL] Dispatching agent '${agentName}' to room '${roomName}'...`);
      await dispatchClient.createDispatch(roomName, agentName, { metadata });

      // Step 2: Create SIP participant to dial the phone number
      const sipClient = new SipClient(httpUrl, apiKey, apiSecret);
      console.log(`[ALERT CALL] Dialing ${alertPhoneNumber} from ${sipFromNumber} via ${sipHostname}...`);

      const sipParticipant = await sipClient.createSipParticipant(
        "", // Empty string when using inline trunk config
        alertPhoneNumber,
        roomName,
        {
          participantIdentity: `phone-${alertPhoneNumber}`,
          participantName: "Alert Call",
          fromNumber: sipFromNumber,
          waitUntilAnswered: true,
        },
        {
          hostname: sipHostname,
          authUsername: sipUsername,
          authPassword: sipPassword,
        } as any
      );

      console.log("[ALERT CALL] SIP Participant answered:", sipParticipant);
      return {
        success: true,
        roomName,
        phoneNumber: alertPhoneNumber,
        participantId: sipParticipant.sipCallId || sipParticipant.participantIdentity,
      };
    } catch (err: any) {
      console.error("[ALERT CALL ERROR] Failed to place SIP call:", err?.message || err);
      return {
        success: false,
        error: err?.message || "Failed to place SIP outbound call",
        statusCode: err?.sipStatusCode || null,
        statusReason: err?.sipStatus || null,
      };
    }
  });
