import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const payloadSchema = z.object({
  machineId: z.string().min(1).max(40),
  machineName: z.string().min(1).max(120),
  status: z.string().min(1).max(40),
  vibration: z.number(),
  cycleTime: z.number(),
  output: z.number(),
  temperature: z.number(),
  detectedAt: z.string().max(60),
});

const ALERT_RECIPIENT = "ravitejaraviteja900@gmail.com";

export const sendCriticalAlertEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) {
      return { sent: false, error: "Email credentials are not configured" };
    }

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6">
        <h2 style="margin:0 0 4px;color:#b42318">CRITICAL — ${data.machineName} (${data.machineId})</h2>
        <p style="margin:0 0 16px;color:#6b7280">Detected at ${data.detectedAt} by Cross-Sense AI+</p>
        <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
          <tr><td><b>Status</b></td><td>${data.status}</td></tr>
          <tr><td><b>Vibration</b></td><td>${data.vibration} mm/s RMS</td></tr>
          <tr><td><b>Cycle time</b></td><td>${data.cycleTime} s</td></tr>
          <tr><td><b>Output</b></td><td>${data.output} u/hr</td></tr>
          <tr><td><b>Temperature</b></td><td>${data.temperature} &deg;C</td></tr>
        </table>
        <p style="margin-top:16px;font-size:14px">
          Multi-agent investigation has been queued. Open the console to review evidence and approve the
          recommended maintenance action.
        </p>
      </div>`;

    const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: "Cross-Sense AI+ <onboarding@resend.dev>",
        to: [ALERT_RECIPIENT],
        subject: `CRITICAL: ${data.machineName} (${data.machineId}) needs attention`,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Resend gateway failed [${response.status}]: ${errorBody}`);
      return { sent: false, error: `Provider error [${response.status}]: ${errorBody}` };
    }

    return { sent: true, to: ALERT_RECIPIENT };
  });
