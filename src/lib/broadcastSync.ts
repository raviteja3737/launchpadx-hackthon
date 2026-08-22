export type SyncHandler<T> = (payload: T) => void;

export function createBroadcastSync<T>(channelName: string, onMessage: SyncHandler<T>) {
  let channel: BroadcastChannel | null = null;

  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel(channelName);
    channel.onmessage = (event: MessageEvent<T>) => onMessage(event.data);
  }

  return {
    post(payload: T) {
      channel?.postMessage(payload);
    },
    close() {
      channel?.close();
      channel = null;
    },
  };
}
