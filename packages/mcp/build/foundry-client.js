import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
export class FoundryClient {
    wss = null;
    activeSocket = null;
    pendingRequests = new Map();
    startServer(port = 33333) {
        this.wss = new WebSocketServer({ port });
        console.log(`MCP Foundry Server | Listening for Bridge connections on ws://localhost:${port}`);
        this.wss.on('connection', (ws) => {
            console.log('MCP Foundry Server | Bridge connected.');
            this.activeSocket = ws;
            ws.on('message', (message) => {
                this.handleMessage(message);
            });
            ws.on('close', () => {
                console.log('MCP Foundry Server | Bridge disconnected.');
                if (this.activeSocket === ws) {
                    this.activeSocket = null;
                }
            });
        });
    }
    handleMessage(message) {
        try {
            const data = JSON.parse(message);
            if (data.id && this.pendingRequests.has(data.id)) {
                const { resolve, reject } = this.pendingRequests.get(data.id);
                this.pendingRequests.delete(data.id);
                if (data.success) {
                    resolve(data.data);
                }
                else {
                    reject(new Error(data.error || 'Unknown error from Bridge'));
                }
            }
        }
        catch (e) {
            console.error('MCP Foundry Server | Failed to parse message', e);
        }
    }
    async sendRequest(action, params = {}) {
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
            this.activeSocket.send(JSON.stringify({ id, action, params }));
        });
    }
}
export const foundryClient = new FoundryClient();
