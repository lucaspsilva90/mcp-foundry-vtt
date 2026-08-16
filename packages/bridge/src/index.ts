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
    socket.registerHandler('actor.clone', ActorHandlers.clone);
    socket.registerHandler('actor.add_items', ActorHandlers.addItems);
    socket.registerHandler('actor.delete_items', ActorHandlers.deleteItems);
    socket.registerHandler('actor.edit_item', ActorHandlers.editItem);
    socket.registerHandler('actor.create_5e_attack', ActorHandlers.create5eAttack);
    socket.registerHandler('actor.create_5e_spell', ActorHandlers.create5eSpell);
    socket.registerHandler('actor.update_stats', ActorHandlers.updateStats);
    socket.registerHandler('actor.read_summary', ActorHandlers.readSummary);
    socket.registerHandler('actor.create_5e_monster', ActorHandlers.create5eMonster);
    socket.registerHandler('actor.create_5e_npc', ActorHandlers.create5eNpc);
    socket.registerHandler('actor.create_5e_encounter', ActorHandlers.create5eEncounter);

    socket.registerHandler('compendium.createPack', CompendiumHandlers.createPack);
    socket.registerHandler('compendium.read', CompendiumHandlers.read);
    socket.registerHandler('compendium.search', CompendiumHandlers.search);
    socket.registerHandler('compendium.create', CompendiumHandlers.create);
    socket.registerHandler('compendium.edit', CompendiumHandlers.edit);
    socket.registerHandler('compendium.createEmbedded', CompendiumHandlers.createEmbedded);
    socket.registerHandler('compendium.updateEmbedded', CompendiumHandlers.updateEmbedded);

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
    socket.registerHandler('item.create_5e_item', ItemHandlers.create5eItem);

    socket.registerHandler('folder.read', FolderHandlers.read);
    socket.registerHandler('folder.create', FolderHandlers.create);
    socket.registerHandler('folder.edit', FolderHandlers.edit);
    socket.registerHandler('folder.deleteEmptyInPack', FolderHandlers.deleteEmptyInPack);

    socket.registerHandler('table.read', TableHandlers.read);
    socket.registerHandler('table.create', TableHandlers.create);
    socket.registerHandler('table.edit', TableHandlers.edit);

    // Start connecting to the MCP Server
    socket.connect();
});
