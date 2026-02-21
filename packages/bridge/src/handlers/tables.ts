export const TableHandlers = {
    read: async (params: { id?: string; name?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        if (params.id) {
            const table = game.tables?.get(params.id);
            if (!table) throw new Error(`RollTable with ID ${params.id} not found.`);
            return table.toObject();
        }

        let tables = game.tables?.contents || [];
        if (params.name) {
            tables = tables.filter(t => t.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        const isMinimal = params.fields !== "full";
        const offset = params.offset || 0;
        const limit = params.limit || tables.length;

        let pagedTables = tables.slice(offset, offset + limit);

        if (isMinimal) {
            return pagedTables.map(t => ({ _id: t.id, name: t.name, formula: t.formula }));
        }

        return pagedTables.map(t => t.toObject());
    },

    create: async (params: { name: string; description?: string; formula?: string; results?: any[]; folder?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create RollTables via Bridge.");

        const tableData: any = {
            name: params.name,
            folder: params.folder
        };

        if (params.description) tableData.description = params.description;
        if (params.formula) tableData.formula = params.formula;
        if (params.results && params.results.length > 0) {
            tableData.results = params.results;
        }

        const newTable = await RollTable.create(tableData);
        if (!newTable) throw new Error("Failed to create RollTable.");
        return newTable.toObject();
    },

    edit: async (params: { id: string; updateData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit RollTables via Bridge.");

        const table = game.tables?.get(params.id);
        if (!table) throw new Error(`RollTable with ID ${params.id} not found.`);

        if (params.updateData && Object.keys(params.updateData).length > 0) {
            await table.update(params.updateData);
        }

        return table.toObject();
    }
};
