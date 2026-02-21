export const CompendiumHandlers = {
    read: async (params: { pack: string; id?: string; name?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Compendium pack ${params.pack} not found.`);

        if (params.id) {
            const doc = await pack.getDocument(params.id);
            if (!doc) throw new Error(`Document ${params.id} not found in pack ${params.pack}.`);
            return doc.toObject();
        }

        const isMinimal = params.fields !== "full";
        let index = await pack.getIndex(isMinimal ? { fields: ["name", "type"] } : undefined);

        if (params.name) {
            index = index.filter((entry: any) => entry.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        // Apply pagination
        let results = Array.from(index);
        const offset = params.offset || 0;
        const limit = params.limit || results.length;
        return results.slice(offset, offset + limit);
    },

    create: async (params: { pack: string; documentData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can modify compendiums via Bridge.");

        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Compendium pack ${params.pack} not found.`);

        const documentClass = (CONFIG as any)[pack.metadata.type as string]?.documentClass;
        if (!documentClass) throw new Error(`Document class ${pack.metadata.type} not found.`);

        // @ts-ignore
        const doc = await documentClass.create(params.documentData, { pack: params.pack });
        return doc.toObject();
    },

    edit: async (params: { pack: string; id: string; updateData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can modify compendiums via Bridge.");

        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Compendium pack ${params.pack} not found.`);

        const doc = await pack.getDocument(params.id);
        if (!doc) throw new Error(`Document ${params.id} not found in pack ${params.pack}.`);

        const updatedDoc = await doc.update(params.updateData);
        return updatedDoc.toObject();
    }
};
