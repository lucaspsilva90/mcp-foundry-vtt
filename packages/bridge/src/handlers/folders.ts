export const FolderHandlers = {
    read: async (params: { id?: string; name?: string; type?: string; pack?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        let folderCollection = game.folders;

        if (params.pack) {
            const pack = game.packs.get(params.pack);
            if (!pack) throw new Error(`Pack ${params.pack} not found.`);
            // @ts-ignore (Foundry v11+ packs have a folders property)
            folderCollection = pack.folders;
        }

        if (params.id) {
            const folder = folderCollection?.get(params.id);
            if (!folder) throw new Error(`Folder with ID ${params.id} not found.`);
            return folder.toObject();
        }

        // If no ID is provided, list folders. We can filter by name or type.
        let folders = folderCollection?.contents || [];
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
            return pagedFolders.map(f => ({
                _id: f.id,
                name: f.name,
                type: f.type,
                // The parent is required to resolve repeated folder names
                // deterministically (e.g. "Class Features" under each class).
                folder: typeof f.folder === "string" ? f.folder : f.folder?.id ?? null
            }));
        }

        return pagedFolders.map(f => f.toObject());
    },

    create: async (params: { name: string; type: string; folder?: string; color?: string; pack?: string }) => {
        // Requires GM privileges typically
        if (!game.user?.isGM) throw new Error("Only GM can create folders via Bridge.");

        const folderData: any = {
            name: params.name,
            type: params.type
        };

        if (params.folder) folderData.folder = params.folder;
        if (params.color) folderData.color = params.color;

        const options = params.pack ? { pack: params.pack } : {};
        const newFolder = await Folder.create(folderData, options);
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
    },

    deleteEmptyInPack: async (params: { pack: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can delete compendium folders via Bridge.");
        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Pack ${params.pack} not found.`);

        const deleted: string[] = [];
        // Delete leaves first. A folder is deleted only when it has neither
        // documents nor child folders; repeat so newly-empty parents follow.
        while (true) {
            const folders = Array.from((pack as any).folders?.contents || []);
            const index = Array.from(await pack.getIndex({ fields: ["folder"] }) as any[]);
            const occupied = new Set(index.map((entry: any) => entry.folder).filter(Boolean));
            const candidate = folders.find((folder: any) => {
                const folderId = folder.id;
                const hasDocuments = occupied.has(folderId);
                const hasChildren = folders.some((other: any) => {
                    const parent = typeof other.folder === "string" ? other.folder : other.folder?.id;
                    return parent === folderId;
                });
                return !hasDocuments && !hasChildren;
            }) as any;
            if (!candidate) break;
            const name = candidate.name;
            await candidate.delete();
            deleted.push(name);
        }
        return { pack: params.pack, deletedCount: deleted.length, deleted };
    }
};
