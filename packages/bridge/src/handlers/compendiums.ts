export const CompendiumHandlers = {
    createPack: async (params: { collection: string; label: string; type: string; description?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create compendiums via Bridge.");

        const [packageName, name] = params.collection.split(".", 2);
        if (packageName !== "world" || !name) {
            throw new Error("Only world compendiums with collection format 'world.name' may be created.");
        }

        const existing = game.packs.get(params.collection);
        if (existing) {
            if (existing.metadata.type !== params.type) {
                throw new Error(`Compendium ${params.collection} already exists with type ${existing.metadata.type}, expected ${params.type}.`);
            }
            return { ...existing.metadata, created: false };
        }

        // Foundry persists world packs itself; `name` is the stable technical
        // identifier and `label` is the user-facing name. Description is kept
        // in the translator registry because Compendium metadata has no stable
        // cross-version description field.
        const pack = await CompendiumCollection.createCompendium({
            type: params.type,
            label: params.label,
            package: "world",
            name
        });
        return { ...pack.metadata, created: true };
    },

    read: async (params: { pack: string; id?: string; name?: string; spellLevel?: number; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Compendium pack ${params.pack} not found.`);

        if (params.id) {
            const doc = await pack.getDocument(params.id);
            if (!doc) throw new Error(`Document ${params.id} not found in pack ${params.pack}.`);
            return doc.toObject();
        }

        const isMinimal = params.fields !== "full";
        // Include level in the compact index so callers can page a spell circle
        // without loading every spell document into memory.
        let index = await pack.getIndex(isMinimal ? { fields: ["name", "type", "system.level"] } : undefined);

        if (params.name) {
            index = index.filter((entry: any) => entry.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }
        if (params.spellLevel !== undefined) {
            index = index.filter((entry: any) => {
                const level = entry.system?.level ?? entry["system.level"];
                return Number(level) === params.spellLevel;
            });
        }

        // Apply pagination
        let results = Array.from(index);
        const offset = params.offset || 0;
        const limit = params.limit || results.length;
        return results.slice(offset, offset + limit);
    },

    search: async (params: { name: string; type?: string; exactMatch?: boolean; limit?: number }) => {
        const queryName = params.name.toLowerCase();
        const limit = params.limit || 5;

        let allMatches: any[] = [];

        for (const pack of game.packs.values()) {
            if (params.type && pack.metadata.type !== params.type) continue;

            // pack.index may not be fully loaded, getIndex fetches it.
            // Using minimal fields to save memory, we'll fetch full doc for final results.
            const index = await pack.getIndex({ fields: ["name", "type"] });

            for (const entry of index) {
                const entryName = (entry.name || "").toLowerCase();
                let isMatch = false;
                let isExact = false;

                if (params.exactMatch) {
                    if (entryName === queryName) {
                        isMatch = true;
                        isExact = true;
                    }
                } else {
                    if (entryName.includes(queryName)) {
                        isMatch = true;
                        if (entryName === queryName) {
                            isExact = true;
                        }
                    }
                }

                if (isMatch) {
                    allMatches.push({
                        packId: pack.metadata.id,
                        packType: pack.metadata.packageType,
                        entryId: entry._id,
                        name: entry.name,
                        type: entry.type,
                        isExact: isExact
                    });
                }
            }
        }

        // Sort priority:
        // 1. Exact match over partial match
        // 2. Multi-tier Package Type fallback: world > module > system (to prioritize premium/user content over SRD)
        allMatches.sort((a, b) => {
            if (a.isExact !== b.isExact) {
                return a.isExact ? -1 : 1;
            }

            type PackPriorityType = 'world' | 'module' | 'system' | 'core';
            const packPriority: Record<PackPriorityType, number> = {
                world: 0,
                module: 1,
                system: 2,
                core: 3
            };

            const aPriority = packPriority[a.packType as PackPriorityType] ?? 99;
            const bPriority = packPriority[b.packType as PackPriorityType] ?? 99;

            return aPriority - bPriority;
        });

        const topMatches = allMatches.slice(0, limit);

        // Fetch full document data for the top matches
        const finalResults = [];
        for (const match of topMatches) {
            const pack = game.packs.get(match.packId);
            if (pack) {
                const doc = await pack.getDocument(match.entryId);
                if (doc) {
                    finalResults.push({
                        packInfo: {
                            id: pack.metadata.id,
                            label: pack.metadata.label,
                            packageType: pack.metadata.packageType
                        },
                        document: doc.toObject()
                    });
                }
            }
        }

        return finalResults;
    },

    create: async (params: { pack: string; documentData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can modify compendiums via Bridge.");

        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Compendium pack ${params.pack} not found.`);

        const documentClass = (CONFIG as any)[pack.metadata.type as string]?.documentClass;
        if (!documentClass) throw new Error(`Document class ${pack.metadata.type} not found.`);

        // @ts-ignore
        const doc = await documentClass.create(params.documentData, { pack: params.pack });
        if (!doc) {
            throw new Error(`Foundry cancelled creation of the document in compendium ${params.pack}. Check the document data and Foundry validation errors.`);
        }
        return doc.toObject();
    },

    edit: async (params: { pack: string; id: string; updateData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can modify compendiums via Bridge.");

        const pack = game.packs.get(params.pack);
        if (!pack) throw new Error(`Compendium pack ${params.pack} not found.`);

        const doc = await pack.getDocument(params.id);
        if (!doc) throw new Error(`Document ${params.id} not found in pack ${params.pack}.`);

        const updatedDoc = await doc.update(params.updateData);
        // Foundry may return undefined for a valid no-op update. The caller
        // still needs the persisted document to verify its folder placement.
        return (updatedDoc || doc).toObject();
    }
};
