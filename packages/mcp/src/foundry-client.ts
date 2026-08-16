import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';

export class FoundryClient {
    private wss: WebSocketServer | null = null;
    private activeSocket: WebSocket | null = null;
    private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();

    public startServer(port: number = 33333) {
        this.wss = new WebSocketServer({ port });

        this.wss.on('connection', (ws) => {
            this.activeSocket = ws;

            ws.on('message', (message: string) => {
                this.handleMessage(message);
            });

            ws.on('close', () => {
                if (this.activeSocket === ws) {
                    this.activeSocket = null;
                }
            });
        });
    }

    public stopServer() {
        if (this.wss) {
            console.error('MCP Foundry Server | Shutting down WebSocket server...');
            for (const client of this.wss.clients) {
                client.terminate();
            }
            this.wss.close();
            this.wss = null;
            this.activeSocket = null;
            console.error('MCP Foundry Server | WebSocket server closed.');
        }
    }

    private handleMessage(message: string) {
        try {
            const data = JSON.parse(message);
            if (data.id && this.pendingRequests.has(data.id)) {
                const { resolve, reject } = this.pendingRequests.get(data.id)!;
                this.pendingRequests.delete(data.id);

                if (data.success) {
                    resolve(data.data);
                } else {
                    reject(new Error(data.error || 'Unknown error from Bridge'));
                }
            }
        } catch (e) {
            console.error('MCP Foundry Server | Failed to parse message', e);
        }
    }

    public async sendRequest<T>(action: string, params: any = {}): Promise<T> {
        if (!this.activeSocket || this.activeSocket.readyState !== WebSocket.OPEN) {
            throw new Error('No active connection to Foundry VTT Bridge.');
        }

        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            this.pendingRequests.set(id, { resolve, reject });

            // Set timeout for request
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request to Bridge timed out (10s).'));
                }
            }, 10000);

            this.activeSocket!.send(JSON.stringify({ id, action, params }));
        });
    }
}

export const foundryClient = new FoundryClient();
