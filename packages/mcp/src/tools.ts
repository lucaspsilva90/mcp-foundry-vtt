import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { foundryClient } from './foundry-client.js';

export function registerTools(server: McpServer) {
    // ---- ACTORS ----
    server.registerTool('read_actors', {
        description: 'Read Actors (NPCs, Characters, Monsters) from Foundry VTT. Use pagination (limit, offset) and minimal fields for large requests.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific actor'),
            name: z.string().optional().describe('Filter by actor name (partial match)'),
            type: z.string().optional().describe('Filter by actor type (e.g., character, npc)'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id, name, and type. "full" returns all data.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_actor', {
        description: 'Create a new Actor in Foundry VTT',
        inputSchema: {
            name: z.string().describe('The name of the actor'),
            type: z.string().describe('The type of actor (e.g., character, npc)'),
            img: z.string().optional().describe('Image path for the actor avatar'),
            system: z.any().optional().describe('System-specific data structure (e.g. abilities, attributes)'),
            baseActorId: z.string().optional().describe('ID of an existing actor to use as a template'),
            baseActorName: z.string().optional().describe('Name of an existing actor to use as a template'),
            folder: z.string().optional().describe('Folder ID to place the new actor in'),
            items: z.array(z.any()).optional().describe('Array of items (spells, class, background, weapons) to include at creation')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_actor', {
        description: 'Edit an existing Actor in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the actor to edit'),
            updateData: z.any().describe('The data changes to apply (e.g. { "name": "New Name", "system.attributes.hp.value": 10 })'),
            itemsToAdd: z.array(z.any()).optional().describe('Array of items to add to the existing actor')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- COMPENDIUMS ----
    server.registerTool('read_compendiums', {
        description: 'Read documents from a Compendium pack. Use pagination and minimal fields rather than dumping a full pack without them.',
        inputSchema: {
            pack: z.string().describe('The exact name of the pack (e.g., dnd5e.monsters)'),
            name: z.string().optional().describe('Filter the compendium index by name (partial match). Always use this first before querying by ID.'),
            id: z.string().optional().describe('The ID of a specific document inside the compendium'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id, name, and type. "full" returns all metadata.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('compendium.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_compendium_entry', {
        description: 'Create a document directly in a Compendium',
        inputSchema: {
            pack: z.string().describe('The exact name of the pack (e.g., dnd5e.monsters)'),
            documentData: z.any().describe('The full data structure needed to create the document')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('compendium.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_compendium_entry', {
        description: 'Edit a document in a Compendium',
        inputSchema: {
            pack: z.string().describe('The exact name of the pack (e.g., dnd5e.monsters)'),
            id: z.string().describe('The ID of the document to edit'),
            updateData: z.any().describe('The data changes to apply')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('compendium.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- NOTES (Journals) ----
    server.registerTool('read_notes', {
        description: 'Read JournalEntries (Notes) from Foundry VTT. Use pagination and minimal fields to avoid huge payloads.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific JournalEntry'),
            name: z.string().optional().describe('Filter by note name (partial match)'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id & name. "full" returns all data.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('note.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_note', {
        description: 'Create a new JournalEntry (Note) in Foundry VTT',
        inputSchema: {
            name: z.string().describe('The title of the note'),
            content: z.string().optional().describe('Body of the note (HTML or plain text)'),
            folder: z.string().optional().describe('Folder ID to place the note in')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('note.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_note', {
        description: 'Edit an existing JournalEntry (Note) in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the note to edit'),
            updateData: z.any().optional().describe('Data changes for the note itself (e.g. { name: "New Title" })'),
            pageId: z.string().optional().describe('If you want to edit a specific page, provide its ID'),
            pageUpdateData: z.any().optional().describe('Data changes for the specific page (e.g. { "text.content": "New content" })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('note.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- SCENES ----
    server.registerTool('read_scenes', {
        description: 'Read Scenes from Foundry VTT. Use pagination and minimal fields to avoid huge payloads.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific scene'),
            name: z.string().optional().describe('Filter by scene name (partial match)'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id & name. "full" returns all data.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('scene.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_scene', {
        description: 'Create a new Scene in Foundry VTT',
        inputSchema: {
            name: z.string().describe('The name of the scene'),
            background: z.string().describe('File path or URL for the background image'),
            width: z.number().optional().describe('Width of the scene in pixels'),
            height: z.number().optional().describe('Height of the scene in pixels')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('scene.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_scene', {
        description: 'Edit an existing Scene in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the scene to edit'),
            updateData: z.any().describe('Data changes to apply to the scene (e.g., width, background.src)'),
            activate: z.boolean().optional().describe('If true, it activates the scene for players')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('scene.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- ITEMS (Global) ----
    server.registerTool('read_items', {
        description: 'Read Global Items (Weapons, Spells, Features, etc.) from Foundry VTT sidebar. Use pagination and minimal fields to avoid huge payloads.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific item'),
            name: z.string().optional().describe('Filter by item name (partial match)'),
            type: z.string().optional().describe('Filter by item type (e.g., weapon, spell)'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id, name, and type. "full" returns all data.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('item.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_item', {
        description: 'Create a new Global Item in Foundry VTT sidebar',
        inputSchema: {
            name: z.string().describe('The name of the item'),
            type: z.string().describe('The type of item (e.g., weapon, spell, feat)'),
            img: z.string().optional().describe('Image path for the item icon'),
            system: z.any().optional().describe('System-specific data structure (e.g. damage, description)'),
            folder: z.string().optional().describe('Folder ID to place the new item in')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('item.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_item', {
        description: 'Edit an existing Global Item in Foundry VTT sidebar',
        inputSchema: {
            id: z.string().describe('The ID of the item to edit'),
            updateData: z.any().describe('The data changes to apply (e.g. { "name": "New Name", "system.description.value": "Cool sword" })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('item.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- FOLDERS ----
    server.registerTool('read_folders', {
        description: 'Read Folders from Foundry VTT. Use pagination and minimal fields to avoid huge payloads.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific folder'),
            name: z.string().optional().describe('Filter by folder name (partial match)'),
            type: z.string().optional().describe('Filter by folder document type (e.g., Actor, Item, Scene, JournalEntry)'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id, name, and type. "full" returns all data.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('folder.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_folder', {
        description: 'Create a new Folder in Foundry VTT',
        inputSchema: {
            name: z.string().describe('The name of the folder'),
            type: z.string().describe('The type of document this folder contains (e.g., Actor, Item, Scene, JournalEntry)'),
            folder: z.string().optional().describe('The ID of the parent folder if nesting'),
            color: z.string().optional().describe('Hex color string for the folder (e.g., #ff0000)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('folder.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_folder', {
        description: 'Edit an existing Folder in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the folder to edit'),
            updateData: z.any().describe('Data changes to apply (e.g., { "name": "New Name", "color": "#00ff00" })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('folder.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- QUESTS ----
    server.registerTool('read_quests', {
        description: 'Read Quests from Foundry VTT. Use pagination and minimal fields to avoid huge payloads.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific quest'),
            status: z.string().optional().describe('Filter by quest status (active, completed, failed)'),
            fields: z.enum(["minimal", "full"]).optional().describe('If "minimal" (default), returns only _id, name, and status. "full" returns all data.'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('quest.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_quest', {
        description: 'Create a new Quest in Foundry VTT',
        inputSchema: {
            name: z.string().describe('The name of the quest'),
            description: z.string().describe('Quest description/objectives (HTML or text)'),
            status: z.string().optional().describe('Initial status, default is "active"')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('quest.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_quest', {
        description: 'Edit an existing Quest in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the quest to edit'),
            status: z.string().optional().describe('Update quest status (active, completed, failed)'),
            newDescription: z.string().optional().describe('Replace quest description with new content'),
            updateData: z.any().optional().describe('Any other JournalEntry update data')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('quest.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });
}
