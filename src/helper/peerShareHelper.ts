import { syncService } from "../../environment.development";

export function webSocketPeerSend(
  onError: () => void,
  onClose: () => void,
  onOpen: () => void,
  onMessage: (msgData: string) => void
) {
  const ws = new WebSocket(syncService);
  ws.binaryType = "arraybuffer";

  ws.addEventListener("error", onError);
  ws.addEventListener("close", onClose);
  ws.addEventListener("open", onOpen);
  ws.addEventListener("message", (msg: { data: string }) => {
    onMessage(msg.data);
  });

  return ws;
}

export function webSocketPeerReceive(
  onError: () => void,
  onClose: () => void,
  onOpen: () => void,
  onMessage: (msgData: Blob) => void
) {
  const ws = new WebSocket(syncService);

  ws.addEventListener("error", onError);
  ws.addEventListener("close", onClose);
  ws.addEventListener("open", onOpen);
  ws.addEventListener("message", (msg: { data: Blob }) => {
    onMessage(msg.data);
  });

  return ws;
}
