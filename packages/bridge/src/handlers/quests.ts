// We use JournalEntries with a specific flag to track Quests
const QUEST_FLAG_SCOPE = "mcp-bridge";
const QUEST_FLAG_KEY = "isQuest";
const QUEST_STATUS_KEY = "questStatus";

export const QuestHandlers = {
    read: async (params: { id?: string; status?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        if (params.id) {
            const note = game.journal?.get(params.id);
            if (!note) throw new Error(`Quest (JournalEntry) with ID ${params.id} not found.`);
            if (!note.getFlag(QUEST_FLAG_SCOPE, QUEST_FLAG_KEY)) throw new Error(`Entry ${params.id} is not a Quest.`);
            return note.toObject();
        }

        let quests = game.journal?.contents.filter(n => n.getFlag(QUEST_FLAG_SCOPE, QUEST_FLAG_KEY)) || [];

        if (params.status) {
            quests = quests.filter(q => q.getFlag(QUEST_FLAG_SCOPE, QUEST_STATUS_KEY) === params.status);
        }

        const isMinimal = params.fields !== "full";
        const offset = params.offset || 0;
        const limit = params.limit || quests.length;

        let pagedQuests = quests.slice(offset, offset + limit);

        if (isMinimal) {
            return pagedQuests.map(q => ({ _id: q.id, name: q.name, status: q.getFlag(QUEST_FLAG_SCOPE, QUEST_STATUS_KEY) }));
        }

        return pagedQuests.map(q => q.toObject());
    },

    create: async (params: { name: string; description: string; status?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create quests via Bridge.");

        const questData: any = {
            name: `[Quest] ${params.name}`,
            pages: [{
                name: params.name,
                type: "text",
                text: { content: params.description, format: 1 }
            }],
            flags: {
                [QUEST_FLAG_SCOPE]: {
                    [QUEST_FLAG_KEY]: true,
                    [QUEST_STATUS_KEY]: params.status || "active"
                }
            }
        };

        const newQuest = await JournalEntry.create(questData);
        if (!newQuest) throw new Error("Failed to create Quest.");
        return newQuest.toObject();
    },

    edit: async (params: { id: string; updateData?: any; status?: string; newDescription?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit quests via Bridge.");

        const note = game.journal?.get(params.id);
        if (!note) throw new Error(`Quest with ID ${params.id} not found.`);

        const updates = params.updateData || {};

        if (params.status) {
            updates.flags = updates.flags || {};
            updates.flags[QUEST_FLAG_SCOPE] = updates.flags[QUEST_FLAG_SCOPE] || {};
            updates.flags[QUEST_FLAG_SCOPE][QUEST_STATUS_KEY] = params.status;
        }

        await note.update(updates);

        if (params.newDescription) {
            const page = note.pages.contents[0]; // Assuming the first page is the description
            if (page) {
                await page.update({ "text.content": params.newDescription });
            }
        }

        return note.toObject();
    }
};
