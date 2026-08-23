import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "ai", "model", "system"]),
  text: z.string(),
});

const askAiInputSchema = z.object({
  query: z.string().min(1).max(2000),
  history: z.array(messageSchema).optional().default([]),
  contextSummary: z.string().optional().default(""),
});

export const SYSTEM_INSTRUCTION = `You are Cross-Sense Copilot, an elite AI Factory Operations Intelligence agent deployed in a high-precision semiconductor & drivetrain fabrication plant.

Your mission is to assist plant managers, line supervisors, and floor operators in monitoring fab health, diagnosing production drop-offs, identifying root causes across multi-modal sensor/vision/SCADA feeds, reviewing multi-agent investigations, and executing maintenance workflows.

### OPERATIONAL KNOWLEDGE & ASSETS:
1. Fab Fleet:
   - M-12 (Wafer Photolithography Stepper #12 - Mission A)
   - M-19 (Plasma Etcher #19 - Mission A)
   - M-24 (Wafer Transport Belt #24 - Mission B)
   - M-31 (Die Bonder #31 - Mission B)
   - M-37 (Chip Pick & Place Arm #37 - Mission B, Drivetrain focus asset)
   - M-44 (Chip Test & Tape Reel #44 - Mission C)

2. Connected Sources (13 Feeds):
   - Vision: Ceiling CCTV Bay 4, Gripper CCTV, Quality Inspection Camera
   - Sensors: Triaxial Vibration Sensor (sampling FFT harmonics), Bearing Temp Probe, Servo Current Monitor, Energy Submeter B-2
   - Systems & Controllers: PLC Cycle Counter, MES Production Feed, SCADA Historian
   - Documents & CMMS: Maintenance Log (CMMS), OEM Service Manual Index, Shift Handover Notes

3. Multi-Agent Investigation Framework:
   - Vision Agent: Visual defect & approach overshoot detection
   - Sensor Agent: Vibration FFT spectrum, bearing harmonic analysis (e.g. 148 Hz outer race), servo drag
   - Data Agent: MES throughput correlation, retry count analysis
   - Document Agent: CMMS maintenance logs, OEM service manual intervals
   - Computer Agent: CMMS work order drafting, email dispatches
   - Verification Agent: Hypothesis elimination & counterfactual checks

### RESPONSE GUIDELINES & STYLE:
- Ground all responses strictly in the provided real-time factory telemetry, active alerts, and investigation findings.
- If live metrics deviate from baseline (e.g. Pick & Place #37 vibration high, cycle time high, output low, machine stopped), cite the exact live numbers versus baseline.
- Structure answers clearly with markdown: bold key metrics, use bullet points, and highlight business impact (e.g., $/hr loss).
- When categorizing your response, use one of the following tags at the start of your message if relevant:
  - [DIAGNOSIS] - For root-cause investigations and machine anomaly diagnoses.
  - [ANALYTICS] - For throughput, yield, power, and factory KPI questions.
  - [EVIDENCE] - For multi-modal sensor/vision/log proof and signal correlation.
  - [ACTION] - For maintenance recommendations, work orders, and recovery steps.
  - [EMAIL] - For notification status, email trails, and recipient logs.
- Keep responses authoritative, crisp, and actionable. Avoid robotic fluff.
- If the operator has changed simulation controls (stopped machines, injected faults), immediately acknowledge the current live state.`;

export interface AskAiResult {
  success: boolean;
  text: string;
  kind?: "analytics" | "diagnosis" | "evidence" | "approval" | "email";
  modelUsed: string;
  error?: string;
}

export function detectKind(text: string): "analytics" | "diagnosis" | "evidence" | "approval" | "email" {
  const upper = text.toUpperCase();
  if (upper.includes("[DIAGNOSIS]")) return "diagnosis";
  if (upper.includes("[EVIDENCE]")) return "evidence";
  if (upper.includes("[ACTION]") || upper.includes("[APPROVAL]")) return "approval";
  if (upper.includes("[EMAIL]")) return "email";
  if (upper.includes("[ANALYTICS]")) return "analytics";
  return "analytics";
}

/**
 * Server function to query Google Gemini 3.5 Flash-Lite with real-time factory telemetry.
 */
export const askAiCopilot = createServerFn({ method: "POST" })
  .validator((data: unknown) => askAiInputSchema.parse(data))
  .handler(async ({ data }): Promise<AskAiResult> => {
    const apiKey =
      process.env["GEMINI_API_KEY"] ||
      process.env["VITE_GEMINI_API_KEY"] ||
      "";

    const modelName =
      process.env["GEMINI_CHAT_MODEL"] ||
      "gemini-3.5-flash-lite";

    if (!apiKey) {
      return {
        success: false,
        text: "Gemini API key is missing. Please verify GEMINI_API_KEY is configured in your .env file.",
        modelUsed: modelName,
        error: "GEMINI_API_KEY not configured",
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Format previous history into Gemini multi-turn format
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      // Add context snapshot as developer/system context or initial grounding turn
      const fullSystemPrompt = `${SYSTEM_INSTRUCTION}\n\n${data.contextSummary}`;

      for (const msg of data.history.slice(-8)) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }

      // Add current query
      contents.push({
        role: "user",
        parts: [{ text: data.query }],
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: 0.25,
          maxOutputTokens: 1000,
        },
      });

      const responseText = response.text || "";
      const kind = detectKind(responseText);

      return {
        success: true,
        text: responseText,
        kind,
        modelUsed: modelName,
      };
    } catch (err: any) {
      console.error("Gemini Copilot execution error:", err);

      // Fallback to direct REST API if SDK has any environment issue
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const restRes = await fetch(restUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${data.contextSummary}` }],
            },
            contents: [
              ...data.history.slice(-6).map((m) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.text }],
              })),
              { role: "user", parts: [{ text: data.query }] },
            ],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (restRes.ok) {
          const restJson = await restRes.json();
          const candidateText =
            restJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (candidateText) {
            return {
              success: true,
              text: candidateText,
              kind: detectKind(candidateText),
              modelUsed: modelName,
            };
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback REST API error:", fallbackErr);
      }

      return {
        success: false,
        text: `Unable to retrieve response from Gemini Copilot (${err?.message || "Unknown error"}). Please check your connection or API key.`,
        modelUsed: modelName,
        error: err?.message,
      };
    }
  });
