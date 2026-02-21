import { z } from 'zod';
import { foundryClient } from './foundry-client.js';
export function registerTools(server) {
    // ---- ACTORS ----
    server.registerTool('read_actors', {
        description: 'Read Actors (NPCs, Characters, Monsters) from Foundry VTT',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific actor'),
            name: z.string().optional().describe('Filter by actor name (partial match)'),
            type: z.string().optional().describe('Filter by actor type (e.g., character, npc)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('actor.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    server.registerTool('create_actor', {
        description: 'Create a new Actor in Foundry VTT',
        inputSchema: {
            name: z.string().describe('The name of the actor'),
            type: z.string().describe('The type of actor (e.g., character, npc)'),
            img: z.string().optional().describe('Image path for the actor avatar'),
            system: z.any().optional().describe('System-specific data structure (e.g. abilities, attributes)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('actor.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    server.registerTool('edit_actor', {
        description: 'Edit an existing Actor in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the actor to edit'),
            updateData: z.any().describe('The data changes to apply (e.g. { "name": "New Name", "system.attributes.hp.value": 10 })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('actor.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    // ---- COMPENDIUMS ----
    server.registerTool('read_compendiums', {
        description: 'Read documents from a Compendium pack',
        inputSchema: {
            pack: z.string().describe('The exact name of the pack (e.g., dnd5e.monsters)'),
            id: z.string().optional().describe('The ID of a specific document inside the compendium')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('compendium.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    server.registerTool('create_compendium_entry', {
        description: 'Create a document directly in a Compendium',
        inputSchema: {
            pack: z.string().describe('The exact name of the pack (e.g., dnd5e.monsters)'),
            documentData: z.any().describe('The full data structure needed to create the document')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('compendium.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('compendium.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    // ---- NOTES (Journals) ----
    server.registerTool('read_notes', {
        description: 'Read JournalEntries (Notes) from Foundry VTT',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific JournalEntry'),
            name: z.string().optional().describe('Filter by note name (partial match)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('note.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('note.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('note.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    // ---- SCENES ----
    server.registerTool('read_scenes', {
        description: 'Read Scenes from Foundry VTT',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific scene'),
            name: z.string().optional().describe('Filter by scene name (partial match)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('scene.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('scene.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('scene.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
    // ---- QUESTS ----
    server.registerTool('read_quests', {
        description: 'Read Quests from Foundry VTT',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific quest'),
            status: z.string().optional().describe('Filter by quest status (active, completed, failed)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest('quest.read', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('quest.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
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
            const result = await foundryClient.sendRequest('quest.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: e.message }], isError: true };
        }
    });
}
