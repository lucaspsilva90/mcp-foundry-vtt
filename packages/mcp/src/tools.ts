import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { foundryClient } from './foundry-client.js';

export function registerTools(server: McpServer) {
    // ---- ACTORS ----

    server.registerTool('create_actor', {
        description: 'Create a new Actor in Foundry VTT. WARNING: If creating a Monster, NPC or Enemy based on an existing D&D creature, ALWAYS use clone_actor instead to inherit all items and activities. Use create_actor ONLY for completely blank slate tokens.',
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
        description: 'Edit an existing Actor in Foundry VTT. WARNING: Prefer update_actor_stats, create_5e_attack, add_5e_spell_to_actor, or add_items_to_actor for D&D 5e modifications. Use edit_actor ONLY for generic fields like name, img, or simple variables.',
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

    server.registerTool('clone_actor', {
        description: 'Clone an existing Actor (e.g. from a compendium) and apply modifications. This is safer than reading a full JSON, editing and creating.',
        inputSchema: {
            sourceUuid: z.string().describe('The UUID or ID of the base Actor (e.g. "Compendium.dnd5e.monsters.Actor.12345" or a world actor ID)'),
            name: z.string().optional().describe('New name for the cloned actor'),
            hp: z.number().optional().describe('Override max HP for the clone (also sets current HP)'),
            folder: z.string().optional().describe('Folder ID to place the cloned actor in'),
            attributes: z.any().optional().describe('Additional attributes to override (e.g. { "system.abilities.str.value": 20 })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.clone', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('add_items_to_actor', {
        description: 'Add existing items (from Compendiums or World) to an Actor by their UUIDs. This avoids passing huge JSON matrices.',
        inputSchema: {
            actorId: z.string().describe('The ID of the target Actor'),
            itemUuids: z.array(z.string()).describe('Array of Item UUIDs to add to the Actor')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.add_items', params);
            return { content: [{ type: 'text', text: `Success: Added items to actor. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('delete_items_from_actor', {
        description: 'Deletar um ou mais Itens (Armas, Magias, Habilidades, etc.) que estão embutidos (embedded) dentro da ficha de um Ator (Actor) específico no Foundry VTT. Ideal para limpar fichas após o "cloning" ou remover habilidades geradas temporariamente.',
        inputSchema: {
            actorId: z.string().describe('O ID do Ator (Actor) de onde os itens serão deletados.'),
            itemIds: z.array(z.string()).describe('Um array de IDs (strings) representando os Itens que devem ser deletados de dentro do Ator.')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.delete_items', params);
            return { content: [{ type: 'text', text: `Success: Deleted items from actor. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_item_in_actor', {
        description: 'Edit an Item that is embedded inside an Actor. Useful for renaming an existing weapon, changing its damage, or adding flavor without recreating it from scratch.',
        inputSchema: {
            actorId: z.string().describe('The ID of the Actor that owns the item'),
            itemId: z.string().describe('The ID of the embedded Item to edit'),
            updateData: z.any().describe('The data changes to apply to the item (e.g. { "name": "Pancada de Raízes", "system.description.value": "Nova descrição" })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.edit_item', params);
            return { content: [{ type: 'text', text: `Success: Edited item in actor. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_5e_attack', {
        description: 'Create an attack or save ability for D&D 5e (v3+), abstracting away the complex system.activities data structure.',
        inputSchema: {
            actorId: z.string().describe('The ID of the target Actor'),
            name: z.string().describe('Name of the attack or ability'),
            actionType: z.enum(["mwak", "rwak", "msak", "rsak", "save", "util", "heal"]).describe('Type of action (e.g. mwak for Melee Weapon Attack, save for Saving Throw)'),
            damageDices: z.string().optional().describe('Damage formula (e.g. "2d8 + 3")'),
            damageType: z.string().optional().describe('Type of damage (e.g. "piercing", "fire")'),
            saveAbility: z.string().optional().describe('Ability for saving throw (e.g. "dex", "con") - Required if actionType is "save"'),
            saveDc: z.number().optional().describe('Fixed DC for saving throw. Leave empty to use standard spellcasting DC if applicable.'),
            ability: z.string().optional().describe('Ability score modifier to use for attack roll (e.g. "str", "dex")')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.create_5e_attack', params);
            return { content: [{ type: 'text', text: `Success: Created 5e attack. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('read_actor_summary', {
        description: 'Read a clean, filtered summary of an Actor (Statblock), discarding empty fields and arrays to preserve token context.',
        inputSchema: {
            id: z.string().optional().describe('The ID of a specific actor'),
            name: z.string().optional().describe('Filter by actor name (partial match)'),
            limit: z.number().optional().describe('Maximum number of items to return (default: all)'),
            offset: z.number().optional().describe('Number of items to skip for pagination (default: 0)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.read_summary', params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_5e_monster', {
        description: 'Create a fully functional CUSTOM 5e Monster/Enemy from scratch. WARNING: If the monster is based on a standard creature from the books (like a Goblin), prioritize using clone_actor. Use this only for entirely custom statblocks.',
        inputSchema: {
            name: z.string().describe('The name of the monster'),
            folder: z.string().optional().describe('Folder ID to place the new monster in'),
            cr: z.number().describe('Challenge Rating (e.g., 5, 0.25)'),
            hp: z.number().describe('Hit Points'),
            ac: z.number().describe('Armor Class'),
            movement: z.string().describe('Movement speed string (e.g., "30 ft, fly 60 ft")'),
            alignment: z.string().describe('Alignment (e.g., "Lawful Evil")'),
            abilities: z.any().optional().describe('Object with ability scores to set (e.g. {"str": 18, "dex": 14})'),
            skills: z.array(z.string()).optional().describe('Array of skill abbreviations (e.g. ["prc", "ste", "ath"])'),
            senses: z.string().optional().describe('Senses as a string (e.g. "Darkvision 60 ft, Passive Perception 18")'),
            damageImmunities: z.string().optional().describe('Damage immunities as a string (e.g. "poison, psychic")'),
            conditionImmunities: z.string().optional().describe('Condition immunities as a string (e.g. "charmed, exhaustion")'),
            languages: z.string().optional().describe('Languages as a string (e.g. "Common, Goblin")'),
            habitat: z.string().optional().describe('Habitat or environment (e.g. "Underdark, Urban")'),
            biography: z.string().optional().describe('General background and lore'),
            appearance: z.string().optional().describe('Physical description'),
            size: z.string().optional().describe('Size category (e.g., "tiny", "sm", "med", "lg", "huge", "grg")'),
            type: z.string().optional().describe('Monster type (e.g., "humanoid", "beast", "undead")')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.create_5e_monster', params);
            return { content: [{ type: 'text', text: `Success: Created 5e monster. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_5e_npc', {
        description: 'Create a roleplay-focused NPC that also supports basic combat stats. Abstraction tool avoiding nested JSON building.',
        inputSchema: {
            name: z.string().describe('The name of the NPC'),
            folder: z.string().optional().describe('Folder ID to place the new NPC in'),
            biography: z.string().describe('General background and plot relevance'),
            appearance: z.string().describe('Physical description'),
            ideals: z.string().optional().describe('Ideals guiding the NPC'),
            bonds: z.string().optional().describe('Bonds and connections'),
            flaws: z.string().optional().describe('Flaws and weaknesses'),
            alignment: z.string().optional().describe('Alignment'),
            voice: z.string().optional().describe('Notes on how to roleplay their voice/mannerisms'),
            cr: z.number().optional().describe('Challenge Rating (e.g. 1/4)'),
            hp: z.number().optional().describe('Hit Points'),
            ac: z.number().optional().describe('Armor Class'),
            movement: z.string().optional().describe('Movement speed string (e.g., "30 ft")'),
            abilities: z.any().optional().describe('Object with ability scores to set (e.g. {"str": 10, "int": 16})'),
            skills: z.array(z.string()).optional().describe('Array of skill abbreviations (e.g. ["prc", "ste", "ath"])'),
            senses: z.string().optional().describe('Senses as a string (e.g. "Darkvision 60 ft, Passive Perception 18")'),
            damageImmunities: z.string().optional().describe('Damage immunities as a string (e.g. "poison, psychic")'),
            conditionImmunities: z.string().optional().describe('Condition immunities as a string (e.g. "charmed, exhaustion")'),
            languages: z.string().optional().describe('Languages as a string (e.g. "Common, Goblin")'),
            habitat: z.string().optional().describe('Habitat or environment (e.g. "Underdark, Urban")')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.create_5e_npc', params);
            return { content: [{ type: 'text', text: `Success: Created 5e NPC. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('add_5e_spell_to_actor', {
        description: 'Create and add a new spell to an actor without managing complex JSON structures.',
        inputSchema: {
            actorId: z.string().describe('The ID of the target Actor'),
            name: z.string().describe('Name of the spell'),
            level: z.number().describe('Spell level (0 for cantrip)'),
            school: z.string().optional().describe('Spell school (e.g., "evo", "abj", "ill")'),
            castingTime: z.string().optional().describe('Casting time (e.g., "1 action", "1 bonus action")'),
            range: z.string().optional().describe('Range (e.g., "120 ft", "Self")'),
            target: z.string().optional().describe('Target (e.g., "1 creature", "20-foot radius sphere")'),
            actionType: z.enum(["save", "attack", "heal", "util", "none"]).optional().describe('The primary action of the spell (used to generate the activity)'),
            damageDices: z.string().optional().describe('Damage/healing formula if applicable (e.g., "8d6")'),
            damageType: z.string().optional().describe('Type of damage or healing (e.g., "fire", "healing")'),
            saveAbility: z.string().optional().describe('Saving throw ability (e.g., "dex", "con") - required if actionType is "save"'),
            saveDc: z.number().optional().describe('Fixed DC for saving throw. Leave empty to use spellcasting DC.')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.create_5e_spell', params);
            return { content: [{ type: 'text', text: `Success: Created 5e spell. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('update_actor_stats', {
        description: 'Shorthand tool to safely update an actors core numeric stats (abilities, skills, saves, ac, cr, movement, size, traits). Use this over edit_actor to avoid nested system path errors.',
        inputSchema: {
            actorId: z.string().describe('The ID of the actor to update'),
            abilities: z.any().optional().describe('Object with ability scores to set (e.g. {"str": 18, "dex": 14})'),
            savingThrows: z.array(z.string()).optional().describe('Array of ability abbreviations the actor is proficient in saving throws (e.g. ["dex", "wis"])'),
            skills: z.array(z.string()).optional().describe('Array of skill abbreviations the actor is proficient in (e.g. ["prc", "ste", "ath"])'),
            cr: z.number().optional().describe('Challenge Rating (for NPCs)'),
            alignment: z.string().optional().describe('Alignment string (e.g. "Chaotic Evil")'),
            ac: z.number().optional().describe('Armor Class (flat override)'),
            movementWalk: z.number().optional().describe('Movement speed in ft'),
            size: z.string().optional().describe('Size (tiny, sm, med, lg, huge, grg)'),
            damageVulnerabilities: z.array(z.string()).optional().describe('Array of damage types (e.g. ["fire"])'),
            damageResistances: z.array(z.string()).optional().describe('Array of damage types'),
            damageImmunities: z.array(z.string()).optional().describe('Array of damage types'),
            conditionImmunities: z.array(z.string()).optional().describe('Array of conditions (e.g. ["poisoned", "prone"])')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.update_stats', params);
            return { content: [{ type: 'text', text: `Success: Stats updated. \n${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('search_world_actors', {
        description: 'Alias to cleanly search for existing WORLD Actors by name. Verifies existence before creating copies.',
        inputSchema: {
            name: z.string().describe('Name of the actor to search for (partial match)'),
            limit: z.number().optional()
        }
    }, async (params) => {
        try {
            const payload = { ...params, fields: "minimal" };
            const result = await foundryClient.sendRequest<any>('actor.read', payload);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    // ---- COMPENDIUMS ----
    server.registerTool('create_compendium', {
        description: 'Ensure a world Compendium exists. Returns the existing pack when the requested collection already exists.',
        inputSchema: {
            collection: z.string().regex(/^world\.[a-z0-9-]+$/).describe('Stable world collection ID, e.g. world.dnd5e-ptbr-magias'),
            label: z.string().describe('Human-readable label shown in Foundry'),
            type: z.enum(['Item', 'Actor', 'JournalEntry', 'RollTable', 'Scene']).describe('Foundry document type stored by the pack'),
            description: z.string().optional().describe('Human documentation for the pack registry')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('compendium.createPack', params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

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

    server.registerTool('search_compendiums', {
        description: 'Search for documents across all compendium packs. Automatically prioritizes premium modules, and user-made world compendiums over standard system compendiums (e.g. SRD).',
        inputSchema: {
            name: z.string().describe('The name of the document to search for (partial match by default)'),
            type: z.string().optional().describe('Optional document type to filter by (e.g., Actor, Item, JournalEntry)'),
            exactMatch: z.boolean().optional().describe('If true, only returns documents that match the name exactly (case-insensitive)'),
            limit: z.number().optional().describe('Maximum number of results to return (default: 5)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('compendium.search', params);
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

    // ---- ENCOUNTERS / COMBATS ----
    server.registerTool('create_5e_encounter_actor', {
        description: 'Create an Actor of type "encounter" (or "group") in the D&D 5e system to group monsters and players together.',
        inputSchema: {
            name: z.string().describe('Name of the encounter'),
            type: z.enum(["encounter", "group"]).optional().describe('The exact type of the actor: "encounter" or "group"'),
            folder: z.string().optional().describe('Folder ID to place the encounter in')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('actor.create_5e_encounter', params);
            return { content: [{ type: 'text', text: `Success: Encounter actor created. \n${JSON.stringify(result)}` }] };
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

    server.registerTool('create_5e_item', {
        description: 'Versatile generator for any 5e item type avoiding nested system JSONs. Use for equipment, loot, consumables, tools, classes, etc.',
        inputSchema: {
            name: z.string().describe('Name of the item'),
            type: z.enum(["consumable", "equipment", "loot", "tool", "background", "class", "subclass", "species", "facility", "container"]).describe('The specific 5e item category'),
            description: z.string().describe('Item description, mechanics and flavor text'),
            price: z.number().optional().describe('Value of the item in GP'),
            weight: z.number().optional().describe('Weight in pounds'),
            rarity: z.string().optional().describe('Item rarity (e.g., "common", "uncommon", "rare", "veryRare", "legendary", "artifact")'),
            folder: z.string().optional().describe('Folder ID to place the item in')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('item.create_5e_item', params);
            return { content: [{ type: 'text', text: `Success: Created 5e item. \n${JSON.stringify(result)}` }] };
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
    server.registerTool('search_scenes', {
        description: 'Alias to cleanly search for existing Scenes by name.',
        inputSchema: {
            name: z.string().describe('Name of the scene to search for (partial match)'),
            limit: z.number().optional()
        }
    }, async (params) => {
        try {
            const payload = { ...params, fields: "minimal" };
            const result = await foundryClient.sendRequest<any>('scene.read', payload);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_scene', {
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
    server.registerTool('search_world_items', {
        description: 'Alias to cleanly search for existing WORLD Items (spells, weapons, features) by name.',
        inputSchema: {
            name: z.string().describe('Name of the item to search for (partial match)'),
            type: z.string().optional().describe('Filter by item type (e.g., weapon, spell)'),
            limit: z.number().optional()
        }
    }, async (params) => {
        try {
            const payload = { ...params, fields: "minimal" };
            const result = await foundryClient.sendRequest<any>('item.read', payload);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_item', {
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
    server.registerTool('search_folders', {
        description: 'Alias to cleanly search for existing Folders by name.',
        inputSchema: {
            name: z.string().describe('Name of the folder to search for (partial match)'),
            type: z.string().optional().describe('Filter by document type (Actor, Item, Scene, JournalEntry)'),
            pack: z.string().optional().describe('The name of the pack if searching inside a compendium'),
            limit: z.number().optional()
        }
    }, async (params) => {
        try {
            const payload = { ...params, fields: "minimal" };
            const result = await foundryClient.sendRequest<any>('folder.read', payload);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_folder', {
        inputSchema: {
            name: z.string().describe('The name of the folder'),
            type: z.string().describe('The type of document this folder contains (e.g., Actor, Item, Scene, JournalEntry)'),
            folder: z.string().optional().describe('The ID of the parent folder if nesting'),
            pack: z.string().optional().describe('The name of the pack if creating inside a compendium'),
            color: z.string().optional().describe('Hex color string for the folder (e.g., #ff0000)')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('folder.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('delete_empty_compendium_folders', {
        description: 'Delete only empty leaf folders from a specific Compendium pack. Folders containing documents or child folders are preserved.',
        inputSchema: {
            pack: z.string().describe('The exact compendium pack to clean')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('folder.deleteEmptyInPack', params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_folder', {
        description: 'Edit an existing Folder in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the folder to edit'),
            updateData: z.any().describe('Data changes to apply (e.g., { "name": "New Name", "color": "#00ff00" })'),
            pack: z.string().optional().describe('The compendium containing the folder, if it is not a world folder')
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

    // ---- TABLES ----
    server.registerTool('search_tables', {
        description: 'Alias to cleanly search for existing RollTables by name.',
        inputSchema: {
            name: z.string().describe('Name of the table to search for (partial match)'),
            limit: z.number().optional()
        }
    }, async (params) => {
        try {
            const payload = { ...params, fields: "minimal" };
            const result = await foundryClient.sendRequest<any>('table.read', payload);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('create_table', {
        inputSchema: {
            name: z.string().describe('The name of the table'),
            description: z.string().optional().describe('Description of the table'),
            formula: z.string().optional().describe('The roll formula (e.g. 1d20)'),
            results: z.array(z.any()).optional().describe('Array of result objects { type: 1|2|3, text: string, weight: number, range: [min,max], drawn: boolean }'),
            folder: z.string().optional().describe('Folder ID to place the table in')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('table.create', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });

    server.registerTool('edit_table', {
        description: 'Edit an existing RollTable in Foundry VTT',
        inputSchema: {
            id: z.string().describe('The ID of the table to edit'),
            updateData: z.any().describe('Data changes for the table (e.g. { name: "New Title", formula: "1d100" })')
        }
    }, async (params) => {
        try {
            const result = await foundryClient.sendRequest<any>('table.edit', params);
            return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
        } catch (e: any) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    });
}
