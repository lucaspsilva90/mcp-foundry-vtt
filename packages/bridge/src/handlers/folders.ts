export const FolderHandlers = {
    read: async (params: { id?: string; name?: string; type?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        if (params.id) {
            const folder = game.folders?.get(params.id);
            if (!folder) throw new Error(`Folder with ID ${params.id} not found.`);
            return folder.toObject();
        }

        // If no ID is provided, list folders. We can filter by name or type.
        let folders = game.folders?.contents || [];
        if (params.type) {
            folders = folders.filter(f => f.type === params.type);
        }
        if (params.name) {
            folders = folders.filter(f => f.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        const isMinimal = params.fields !== "full";
        const offset = params.offset || 0;
        const limit = params.limit || folders.length;

        let pagedFolders = folders.slice(offset, offset + limit);

        if (isMinimal) {
            return pagedFolders.map(f => ({ _id: f.id, name: f.name, type: f.type }));
        }

        return pagedFolders.map(f => f.toObject());
    },

    create: async (params: { name: string; type: string; folder?: string; color?: string }) => {
        // Requires GM privileges typically
        if (!game.user?.isGM) throw new Error("Only GM can create folders via Bridge.");

        const folderData: any = {
            name: params.name,
            type: params.type
        };

        if (params.folder) folderData.folder = params.folder;
        if (params.color) folderData.color = params.color;

        const newFolder = await Folder.create(folderData);
        if (!newFolder) throw new Error("Failed to create folder.");

        return newFolder.toObject();
    },

    edit: async (params: { id: string; updateData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit folders via Bridge.");

        const folder = game.folders?.get(params.id);
        if (!folder) throw new Error(`Folder with ID ${params.id} not found.`);

        const updatedFolder = await folder.update(params.updateData);
        if (!updatedFolder) throw new Error("Failed to update folder.");

        return updatedFolder.toObject();
    }
};
