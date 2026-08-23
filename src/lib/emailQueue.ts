import { sendCriticalAlertEmail } from "@/lib/alertEmail.functions";
import { toast } from "sonner";

export interface AlertEmailPayload {
  machineId: string;
  machineName: string;
  status: string;
  vibration: number;
  cycleTime: number;
  output: number;
  temperature: number;
  detectedAt: string;
  eventType?: "STOPPED" | "STARTED" | "CRITICAL" | "WARNING" | "RESTORED" | "TEST";
}

export interface QueueItem {
  id: string;
  payload: AlertEmailPayload;
  reason: string;
  enqueuedAt: number;
  resolve: (res: {
    sent: boolean;
    dismissed?: boolean;
    queued?: boolean;
    error?: string | undefined;
    to?: string | undefined;
  }) => void;
}


export interface QueueStatus {
  isSending: boolean;
  queueLength: number;
  maxQueueSize: number;
  cooldownMs: number;
  lastSentTimestamp: number;
  dismissedCount: number;
  sentCount: number;
}

const COOLDOWN_MS = 3000; // 1 email every 3 seconds
const MAX_QUEUE_SIZE = 2; // Maximum 2 pending emails in queue

class EmailQueueManager {
  private queue: QueueItem[] = [];
  private isSending = false;
  private lastSentTimestamp = 0;
  private timer: NodeJS.Timeout | null = null;
  private dismissedCount = 0;
  private sentCount = 0;
  private listeners: Array<(status: QueueStatus) => void> = [];

  public subscribe(listener: (status: QueueStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public getStatus(): QueueStatus {
    return {
      isSending: this.isSending,
      queueLength: this.queue.length,
      maxQueueSize: MAX_QUEUE_SIZE,
      cooldownMs: COOLDOWN_MS,
      lastSentTimestamp: this.lastSentTimestamp,
      dismissedCount: this.dismissedCount,
      sentCount: this.sentCount,
    };
  }

  /**
   * Dispatches or queues an alert email respecting:
   * 1) 1 email every 3 seconds rate limit
   * 2) Maximum 2 pending in queue
   * 3) Any above 2 are immediately dismissed
   */
  public enqueue(
    payload: AlertEmailPayload,
    reason: string,
    sendFn: (opts: { data: AlertEmailPayload }) => Promise<{ sent: boolean; to?: string | undefined; error?: string | undefined }>
  ): Promise<{ sent: boolean; dismissed?: boolean; queued?: boolean; error?: string | undefined; to?: string | undefined }> {
    return new Promise((resolve) => {
      const now = Date.now();
      const timeSinceLast = now - this.lastSentTimestamp;
      const canSendImmediately = !this.isSending && timeSinceLast >= COOLDOWN_MS && this.queue.length === 0;

      if (canSendImmediately) {
        // Send right away
        this.executeSend(payload, reason, sendFn, resolve);
        return;
      }

      // Check if queue has space (max 2)
      if (this.queue.length < MAX_QUEUE_SIZE) {
        const item: QueueItem = {
          id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          payload,
          reason,
          enqueuedAt: now,
          resolve,
        };
        this.queue.push(item);
        const position = this.queue.length;
        const etaSeconds = Math.ceil(
          Math.max(0, COOLDOWN_MS - (now - this.lastSentTimestamp)) / 1000 + (position - 1) * 3
        );

        toast.info(`Alert queued for ${payload.machineId} (${position}/${MAX_QUEUE_SIZE})`, {
          description: `Rate limit 1 email/3s. Est. send in ~${etaSeconds}s.`,
        });

        this.notify();
        this.scheduleNext(sendFn);
      } else {
        // Queue is FULL (already 2 pending) -> DISMISS
        this.dismissedCount++;
        this.notify();

        toast.warning(`Alert dismissed for ${payload.machineId}`, {
          description: `Queue full (${MAX_QUEUE_SIZE}/${MAX_QUEUE_SIZE}). Email was dismissed to enforce 3s rate limit.`,
        });

        resolve({
          sent: false,
          dismissed: true,
          error: `Queue capacity of ${MAX_QUEUE_SIZE} exceeded. Email dismissed to respect 3s rate limit.`,
        });
      }
    });
  }

  private async executeSend(
    payload: AlertEmailPayload,
    reason: string,
    sendFn: (opts: { data: AlertEmailPayload }) => Promise<{ sent: boolean; to?: string | undefined; error?: string | undefined }>,
    resolve: (res: { sent: boolean; dismissed?: boolean; queued?: boolean; error?: string | undefined; to?: string | undefined }) => void
  ) {
    this.isSending = true;
    this.lastSentTimestamp = Date.now();
    this.notify();

    try {
      const result = await sendFn({ data: payload });
      this.lastSentTimestamp = Date.now();
      if (result.sent) {
        this.sentCount++;
        toast.error(`Alert emailed — ${payload.machineId}`, {
          description: `${reason} · sent to ${result.to ?? "recipient"}`,
        });
        resolve({ sent: true, to: result.to });
      } else {
        toast.warning(`Could not email alert for ${payload.machineId}`, {
          description: result.error ?? "Unknown error",
        });
        resolve({ sent: false, error: result.error });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(`Email delivery failed for ${payload.machineId}`, { description: msg });
      resolve({ sent: false, error: msg });
    } finally {
      this.isSending = false;
      this.notify();
      this.scheduleNext(sendFn);
    }
  }

  private scheduleNext(
    sendFn: (opts: { data: AlertEmailPayload }) => Promise<{ sent: boolean; to?: string | undefined; error?: string | undefined }>
  ) {
    if (this.queue.length === 0 || this.isSending) return;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const now = Date.now();
    const elapsed = now - this.lastSentTimestamp;
    const waitTime = Math.max(0, COOLDOWN_MS - elapsed);

    this.timer = setTimeout(() => {
      if (this.queue.length > 0 && !this.isSending) {
        const nextItem = this.queue.shift()!;
        this.notify();
        this.executeSend(nextItem.payload, nextItem.reason, sendFn, nextItem.resolve);
      }
    }, waitTime);
  }
}

export const emailQueueManager = new EmailQueueManager();
