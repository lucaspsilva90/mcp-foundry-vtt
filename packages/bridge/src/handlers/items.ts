export const ItemHandlers = {
    read: async (params: { id?: string; name?: string; type?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        if (params.id) {
            const item = game.items?.get(params.id);
            if (!item) throw new Error(`Item with ID ${params.id} not found.`);
            return item.toObject();
        }

        // If no ID is provided, list items. We can filter by name or type.
        let items = game.items?.contents || [];
        if (params.type) {
            items = items.filter(a => a.type === params.type);
        }
        if (params.name) {
            items = items.filter(a => a.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        const isMinimal = params.fields !== "full";
        const offset = params.offset || 0;
        const limit = params.limit || items.length;

        let pagedItems = items.slice(offset, offset + limit);

        if (isMinimal) {
            return pagedItems.map(a => ({ _id: a.id, name: a.name, type: a.type }));
        }

        return pagedItems.map(a => a.toObject());
    },

    create: async (params: { name: string; type: string; system?: any; img?: string; folder?: string }) => {
        // Requires GM privileges typically
        if (!game.user?.isGM) throw new Error("Only GM can create items via Bridge.");

        const itemData: any = {
            name: params.name,
            type: params.type,
            system: params.system || {}
        };
        if (params.img) itemData.img = params.img;
        if (params.folder) itemData.folder = params.folder;

        const newItem = await Item.create(itemData);
        if (!newItem) throw new Error("Failed to create item.");

        return newItem.toObject();
    },

    edit: async (params: { id: string; updateData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit items via Bridge.");

        const item = game.items?.get(params.id);
        if (!item) throw new Error(`Item with ID ${params.id} not found.`);

        const updatedItem = await item.update(params.updateData);
        if (!updatedItem) throw new Error("Failed to update item.");

        return updatedItem.toObject();
    }
};
