import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe';
  channel: string;
}

interface SubscribedClient {
  ws: WebSocket;
  channels: Set<string>;
}

export class WebSocketServer {
  private wss: WSServer | null = null;
  private clients: Map<WebSocket, SubscribedClient> = new Map();
  private channels: Map<string, Set<WebSocket>> = new Map();
  private messageQueue: Map<string, any[]> = new Map();
  private sequenceNumbers: Map<string, number> = new Map();

  constructor(private opts: { port: number }) {}

  start(server?: Server): void {
    this.wss = new WSServer({ server });
    this.wss.on('connection', (ws, req) => {
      this.clients.set(ws, { ws, channels: new Set() });
      
      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleClose(ws));
      ws.on('error', (err) => console.error('WS error', err));
    });
  }

  private handleMessage(ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[]): void {
    try {
      const raw = data instanceof Buffer ? data.toString() : JSON.stringify(data);
      const msg: ClientMessage = JSON.parse(raw);
      const client = this.clients.get(ws);
      if (!client) return;

      if (msg.type === 'subscribe') {
        client.channels.add(msg.channel);
        if (!this.channels.has(msg.channel)) {
          this.channels.set(msg.channel, new Set());
        }
        this.channels.get(msg.channel)!.add(ws);
      } else if (msg.type === 'unsubscribe') {
        client.channels.delete(msg.channel);
        this.channels.get(msg.channel)?.delete(ws);
      }
    } catch (err) {
      console.error('WS message parse error', err);
    }
  }

  private handleClose(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      for (const channel of client.channels) {
        this.channels.get(channel)?.delete(ws);
      }
      this.clients.delete(ws);
    }
  }

  broadcast(event: { channel: string; type: string; data: any; timestamp: number }): void {
    const channel = this.channels.get(event.channel);
    if (!channel) return;

    const seq = this.sequenceNumbers.get(event.channel) || 0;
    this.sequenceNumbers.set(event.channel, seq + 1);

    const payload = JSON.stringify({ ...event, sequence: seq + 1 });

    for (const ws of channel) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  broadcastEscrowUpdate(escrowId: string, status: string, data: any): void {
    this.broadcast({
      channel: `escrow:${escrowId}`,
      type: 'escrow.update',
      data: { escrowId, status, ...data },
      timestamp: Date.now(),
    });
    this.broadcast({
      channel: 'escrows',
      type: 'escrow.update',
      data: { escrowId, status, ...data },
      timestamp: Date.now(),
    });
  }

  close(): void {
    this.wss?.close();
  }
}