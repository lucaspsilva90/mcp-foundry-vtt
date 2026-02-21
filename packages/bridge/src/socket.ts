export class BridgeSocket {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 5000;
    private handlers: Map<string, Function>;

    constructor(url: string = 'ws://localhost:33333') {
        this.url = url;
        this.handlers = new Map();
    }

    public registerHandler(action: string, handler: Function) {
        this.handlers.set(action, handler);
    }

    public connect() {
        console.log(`MCP Bridge | Attempting to connect to ${this.url}`);
        try {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log(`MCP Bridge | Connected to MCP Server.`);
            };

            this.socket.onmessage = async (event) => {
                await this.handleMessage(event.data);
            };

            this.socket.onclose = () => {
                console.log(`MCP Bridge | Disconnected. Reconnecting in ${this.reconnectInterval}ms...`);
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.socket.onerror = (error) => {
                console.error(`MCP Bridge | WebSocket Error: `, error);
                this.socket?.close();
            };
        } catch (e) {
            console.error(`MCP Bridge | Connection failed: `, e);
            setTimeout(() => this.connect(), this.reconnectInterval);
        }
    }

    private async handleMessage(data: string) {
        let payload;
        try {
            payload = JSON.parse(data);
        } catch (e) {
            console.error('MCP Bridge | Failed to parse message', data);
            return;
        }

        const { id, action, params } = payload;
        if (!action || !id) return;

        try {
            const handler = this.handlers.get(action);
            if (handler) {
                const result = await handler(params);
                this.sendResponse(id, { success: true, data: result });
            } else {
                this.sendResponse(id, { success: false, error: `Unknown action: ${action}` });
            }
        } catch (error: any) {
            this.sendResponse(id, { success: false, error: error.message || String(error) });
        }
    }

    private sendResponse(id: string, payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ id, ...payload }));
        }
    }
}
