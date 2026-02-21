import { BridgeSocket } from "./socket.js";
import { ActorHandlers } from "./handlers/actors.js";
import { CompendiumHandlers } from "./handlers/compendiums.js";
import { NoteHandlers } from "./handlers/notes.js";
import { SceneHandlers } from "./handlers/scenes.js";
import { QuestHandlers } from "./handlers/quests.js";
import { ItemHandlers } from "./handlers/items.js";
import { FolderHandlers } from "./handlers/folders.js";
import { TableHandlers } from "./handlers/tables.js";

Hooks.once('init', () => {
    console.log('MCP Bridge | Initializing MCP Bridge module');

    game.settings.register('mcp-bridge', 'mcpServerUrl', {
        name: "MCP Server WebSocket URL",
        hint: "The connection address for your MCP server (e.g., ws://localhost:33333)",
        scope: "world",
        config: true,
        type: String,
        default: "ws://localhost:33333"
    });
});

Hooks.once('ready', () => {
    console.log('MCP Bridge | Module ready. Setting up Socket connection.');

    // Initialize Socket connection
    const serverUrl = game.settings.get('mcp-bridge', 'mcpServerUrl') as string;
    const socket = new BridgeSocket(serverUrl);

    // Register Handlers
    socket.registerHandler('actor.read', ActorHandlers.read);
    socket.registerHandler('actor.create', ActorHandlers.create);
    socket.registerHandler('actor.edit', ActorHandlers.edit);

    socket.registerHandler('compendium.read', CompendiumHandlers.read);
    socket.registerHandler('compendium.search', CompendiumHandlers.search);
    socket.registerHandler('compendium.create', CompendiumHandlers.create);
    socket.registerHandler('compendium.edit', CompendiumHandlers.edit);

    socket.registerHandler('note.read', NoteHandlers.read);
    socket.registerHandler('note.create', NoteHandlers.create);
    socket.registerHandler('note.edit', NoteHandlers.edit);

    socket.registerHandler('scene.read', SceneHandlers.read);
    socket.registerHandler('scene.create', SceneHandlers.create);
    socket.registerHandler('scene.edit', SceneHandlers.edit);

    socket.registerHandler('quest.read', QuestHandlers.read);
    socket.registerHandler('quest.create', QuestHandlers.create);
    socket.registerHandler('quest.edit', QuestHandlers.edit);

    socket.registerHandler('item.read', ItemHandlers.read);
    socket.registerHandler('item.create', ItemHandlers.create);
    socket.registerHandler('item.edit', ItemHandlers.edit);

    socket.registerHandler('folder.read', FolderHandlers.read);
    socket.registerHandler('folder.create', FolderHandlers.create);
    socket.registerHandler('folder.edit', FolderHandlers.edit);

    socket.registerHandler('table.read', TableHandlers.read);
    socket.registerHandler('table.create', TableHandlers.create);
    socket.registerHandler('table.edit', TableHandlers.edit);

    // Start connecting to the MCP Server
    socket.connect();
});
