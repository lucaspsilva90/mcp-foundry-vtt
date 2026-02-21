export const NoteHandlers = {
    read: async (params: { id?: string; name?: string }) => {
        if (params.id) {
            const note = game.journal?.get(params.id);
            if (!note) throw new Error(`JournalEntry with ID ${params.id} not found.`);
            return note.toObject();
        }

        let notes = game.journal?.contents || [];
        if (params.name) {
            notes = notes.filter(n => n.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        return notes.map(n => n.toObject());
    },

    create: async (params: { name: string; content?: string; folder?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create journals via Bridge.");

        const noteData: any = {
            name: params.name,
            folder: params.folder
        };

        if (params.content) {
            noteData.pages = [{
                name: params.name,
                type: "text",
                text: { content: params.content, format: 1 } // 1 usually means HTML
            }];
        }

        const newNote = await JournalEntry.create(noteData);
        if (!newNote) throw new Error("Failed to create JournalEntry.");
        return newNote.toObject();
    },

    edit: async (params: { id: string; updateData: any; pageId?: string; pageUpdateData?: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit journals via Bridge.");

        const note = game.journal?.get(params.id);
        if (!note) throw new Error(`JournalEntry with ID ${params.id} not found.`);

        if (params.updateData && Object.keys(params.updateData).length > 0) {
            await note.update(params.updateData);
        }

        if (params.pageId && params.pageUpdateData) {
            const page = note.pages.get(params.pageId);
            if (page) {
                await page.update(params.pageUpdateData);
            } else {
                throw new Error(`Page ID ${params.pageId} not found in JournalEntry ${params.id}`);
            }
        }

        return note.toObject();
    }
};
