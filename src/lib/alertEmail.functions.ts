import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const payloadSchema = z.object({
  machineId: z.string().min(1).max(40),
  machineName: z.string().min(1).max(120),
  status: z.string().min(1).max(160),
  vibration: z.number(),
  cycleTime: z.number(),
  output: z.number(),
  temperature: z.number(),
  detectedAt: z.string().max(60),
  eventType: z.enum(["STOPPED", "STARTED", "CRITICAL", "WARNING", "RESTORED", "TEST"]).optional(),
});

const ALERT_RECIPIENT = process.env["ALERT_RECIPIENT_EMAIL"] || "257r1a6704@cmrtc.ac.in";
const COOLDOWN_MS = 3000; // 1 email every 3 seconds
const MAX_QUEUE = 2; // Max 2 pending emails in queue

// Server-side rate limit & queue state
interface ServerQueueItem {
  data: z.infer<typeof payloadSchema>;
  resolve: (res: { sent: boolean; dismissed?: boolean; queued?: boolean; error?: string | undefined; to?: string | undefined }) => void;
}

const serverQueue: ServerQueueItem[] = [];
let isProcessing = false;
let lastSentTimestamp = 0;

function buildEmailContent(data: z.infer<typeof payloadSchema>) {
  const eventType = data.eventType ?? "CRITICAL";

  if (eventType === "STOPPED") {
    return {
      subject: `🛑 SYSTEM STOPPED: ${data.machineName} (${data.machineId})`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;border:1px solid #fee2e2;border-radius:8px;padding:20px;background:#fff">
          <div style="background:#fef2f2;border-left:4px solid #b42318;padding:12px 16px;border-radius:4px;margin-bottom:16px">
            <h2 style="margin:0 0 4px;color:#b42318;font-size:18px">MACHINE STOPPED — ${data.machineName} (${data.machineId})</h2>
            <p style="margin:0;color:#991b1b;font-size:13px">Logged at ${data.detectedAt} by Cross-Sense AI+</p>
          </div>
          <p style="font-size:14px;color:#374151;margin:0 0 16px">
            <b>Notice:</b> The asset has been powered down or taken offline. Telemetry acquisition is paused.
          </p>
          <table cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%;background:#f9fafb;border-radius:6px">
            <tr><td style="color:#6b7280;width:140px"><b>Machine ID</b></td><td>${data.machineId}</td></tr>
            <tr><td style="color:#6b7280"><b>Asset Name</b></td><td>${data.machineName}</td></tr>
            <tr><td style="color:#6b7280"><b>Operational State</b></td><td style="color:#b42318;font-weight:bold">Offline / Stopped</td></tr>
            <tr><td style="color:#6b7280"><b>Event Timestamp</b></td><td>${data.detectedAt}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:13px;color:#6b7280">
            No further stoppage alerts will be sent while this asset remains stopped. A startup email will automatically be dispatched once the system is resumed.
          </p>
        </div>`,
    };
  }

  if (eventType === "STARTED") {
    return {
      subject: `✅ SYSTEM STARTED: ${data.machineName} (${data.machineId}) is now Online`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;border:1px solid #d1fae5;border-radius:8px;padding:20px;background:#fff">
          <div style="background:#ecfdf5;border-left:4px solid #027a48;padding:12px 16px;border-radius:4px;margin-bottom:16px">
            <h2 style="margin:0 0 4px;color:#027a48;font-size:18px">MACHINE ONLINE — ${data.machineName} (${data.machineId})</h2>
            <p style="margin:0;color:#065f46;font-size:13px">Logged at ${data.detectedAt} by Cross-Sense AI+</p>
          </div>
          <p style="font-size:14px;color:#374151;margin:0 0 16px">
            <b>Notice:</b> The asset has been powered on and resumed active production telemetry.
          </p>
          <table cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%;background:#f9fafb;border-radius:6px">
            <tr><td style="color:#6b7280;width:140px"><b>Status</b></td><td style="color:#027a48;font-weight:bold">Online &amp; Operational</td></tr>
            <tr><td style="color:#6b7280"><b>Output Baseline</b></td><td>${data.output} u/hr</td></tr>
            <tr><td style="color:#6b7280"><b>Cycle Time</b></td><td>${data.cycleTime} s</td></tr>
            <tr><td style="color:#6b7280"><b>Vibration</b></td><td>${data.vibration} mm/s RMS</td></tr>
            <tr><td style="color:#6b7280"><b>Temperature</b></td><td>${data.temperature} &deg;C</td></tr>
          </table>
          <p style="margin-top:16px;font-size:13px;color:#6b7280">
            Real-time monitoring active. The system is operating within nominal specifications.
          </p>
        </div>`,
    };
  }

  // Default Anomaly / Degradation Alert
  return {
    subject: `⚠️ ALERT: ${data.machineName} (${data.machineId}) — ${data.status}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;border:1px solid #fed7aa;border-radius:8px;padding:20px;background:#fff">
        <div style="background:#fff7ed;border-left:4px solid #c2410c;padding:12px 16px;border-radius:4px;margin-bottom:16px">
          <h2 style="margin:0 0 4px;color:#c2410c;font-size:18px">MACHINE ANOMALY ALERT — ${data.machineName} (${data.machineId})</h2>
          <p style="margin:0;color:#9a3412;font-size:13px">Detected at ${data.detectedAt} by Cross-Sense AI+</p>
        </div>
        <table cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%;background:#f9fafb;border-radius:6px">
          <tr><td style="color:#6b7280;width:140px"><b>Condition</b></td><td style="color:#c2410c;font-weight:bold">${data.status}</td></tr>
          <tr><td style="color:#6b7280"><b>Vibration</b></td><td>${data.vibration} mm/s RMS</td></tr>
          <tr><td style="color:#6b7280"><b>Cycle Time</b></td><td>${data.cycleTime} s</td></tr>
          <tr><td style="color:#6b7280"><b>Current Output</b></td><td>${data.output} u/hr</td></tr>
          <tr><td style="color:#6b7280"><b>Temperature</b></td><td>${data.temperature} &deg;C</td></tr>
        </table>
        <p style="margin-top:16px;font-size:13px;color:#374151">
          Multi-agent investigation has been queued. Open the Cross-Sense console to review correlated evidence and approve recommended actions.
        </p>
      </div>`,
  };
}

async function executeResendCall(
  data: z.infer<typeof payloadSchema>,
): Promise<{ sent: boolean; to?: string; error?: string }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  const recipient = process.env["ALERT_RECIPIENT_EMAIL"] || ALERT_RECIPIENT;

  if (!resendKey && !lovableKey) {
    return {
      sent: false,
      error: "Email credentials are not configured. Please add RESEND_API_KEY to your .env file.",
    };
  }

  const { subject, html } = buildEmailContent(data);

  try {
    let response: Response;

    if (lovableKey && resendKey) {
      // Lovable Connector Gateway
      response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify({
          from: "Cross-Sense AI+ <onboarding@resend.dev>",
          to: [recipient],
          subject,
          html,
        }),
      });
    } else {
      // Direct Resend API
      const apiKey = resendKey || lovableKey;
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "Cross-Sense AI+ <onboarding@resend.dev>",
          to: [recipient],
          subject,
          html,
        }),
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Resend delivery failed [${response.status}]: ${errorBody}`);
      return { sent: false, error: `Provider error [${response.status}]: ${errorBody}` };
    }

    return { sent: true, to: recipient };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Alert email request error:", errorMessage);
    return { sent: false, error: errorMessage };
  }
}


function processNextInQueue() {
  if (serverQueue.length === 0 || isProcessing) return;

  const now = Date.now();
  const elapsed = now - lastSentTimestamp;
  const waitMs = Math.max(0, COOLDOWN_MS - elapsed);

  setTimeout(async () => {
    if (serverQueue.length === 0 || isProcessing) return;
    const nextItem = serverQueue.shift()!;
    isProcessing = true;
    lastSentTimestamp = Date.now();

    try {
      const res = await executeResendCall(nextItem.data);
      lastSentTimestamp = Date.now();
      nextItem.resolve(res);
    } catch (err: unknown) {
      nextItem.resolve({
        sent: false,
        error: err instanceof Error ? err.message : "Error processing email",
      });
    } finally {
      isProcessing = false;
      processNextInQueue();
    }
  }, waitMs);
}

/**
 * Sends a critical alert email with:
 * - 1 email every 3 seconds limit
 * - Max 2 emails queued
 * - Any beyond 2 are dismissed
 */
export const sendCriticalAlertEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const now = Date.now();
    const elapsed = now - lastSentTimestamp;
    const canSendNow = !isProcessing && elapsed >= COOLDOWN_MS && serverQueue.length === 0;

    if (canSendNow) {
      isProcessing = true;
      lastSentTimestamp = Date.now();
      try {
        const result = await executeResendCall(data);
        lastSentTimestamp = Date.now();
        return result;
      } finally {
        isProcessing = false;
        processNextInQueue();
      }
    }

    // Check queue capacity (max 2)
    if (serverQueue.length < MAX_QUEUE) {
      return new Promise<{
        sent: boolean;
        dismissed?: boolean;
        queued?: boolean;
        error?: string | undefined;
        to?: string | undefined;
      }>((resolve) => {
        serverQueue.push({ data, resolve });
        processNextInQueue();
      });
    }

    // Above 2 pending items -> DISMISS
    return {
      sent: false,
      dismissed: true,
      error: `Queue capacity limit (${MAX_QUEUE}) reached. Alert dismissed to respect 3s rate limit.`,
    };
  });

/**
 * Status checker for Resend integration
 */
export const checkResendStatus = createServerFn({ method: "GET" }).handler(async () => {
  const resendKey = process.env["RESEND_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const recipient = process.env["ALERT_RECIPIENT_EMAIL"] || ALERT_RECIPIENT;

  const hasKey = Boolean(resendKey || lovableKey);
  const isResendFormat = resendKey ? resendKey.startsWith("re_") : false;

  return {
    configured: hasKey,
    hasResendKey: Boolean(resendKey),
    hasLovableKey: Boolean(lovableKey),
    keyPreview: resendKey
      ? `${resendKey.substring(0, 6)}...${resendKey.substring(resendKey.length - 4)}`
      : undefined,
    isValidResendFormat: isResendFormat,
    recipient,
    rateLimitSec: 3,
    maxQueue: 2,
    pendingInQueue: serverQueue.length,
    statusMessage: hasKey
      ? isResendFormat || lovableKey
        ? "Resend is ready to dispatch emails."
        : "API key found, but does not match standard 're_...' format."
      : "RESEND_API_KEY is not configured in .env",
  };
});

