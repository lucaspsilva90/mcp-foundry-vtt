#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { foundryClient } from "./foundry-client.js";
async function main() {
    // Start the WebSocket Server for the Bridge to connect to
    foundryClient.startServer(33333);
    const server = new McpServer({
        name: "foundry-vtt-mcp",
        version: "1.0.0",
    });
    registerTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
