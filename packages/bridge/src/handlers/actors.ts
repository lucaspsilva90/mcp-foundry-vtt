// Types for Foundry VTT globals (partially declared by foundry-vtt-types)

export const ActorHandlers = {
    read: async (params: { id?: string; name?: string; type?: string }) => {
        if (params.id) {
            const actor = game.actors?.get(params.id);
            if (!actor) throw new Error(`Actor with ID ${params.id} not found.`);
            return actor.toObject();
        }

        // If no ID is provided, list actors. We can filter by name or type.
        let actors = game.actors?.contents || [];
        if (params.type) {
            actors = actors.filter(a => a.type === params.type);
        }
        if (params.name) {
            actors = actors.filter(a => a.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        return actors.map(a => a.toObject());
    },

    create: async (params: { name: string; type: string; system?: any; img?: string; baseActorId?: string; baseActorName?: string; folder?: string; items?: any[] }) => {
        // Requires GM privileges typically
        if (!game.user?.isGM) throw new Error("Only GM can create actors via Bridge.");

        let baseData: any = {};
        if (params.baseActorId || params.baseActorName) {
            let baseActor = params.baseActorId ? game.actors?.get(params.baseActorId) : undefined;
            if (!baseActor && params.baseActorName) {
                baseActor = game.actors?.contents.find(a => a.name?.toLowerCase() === params.baseActorName!.toLowerCase());
            }

            if (baseActor) {
                baseData = baseActor.toObject();
                // Remove fields that should not be copied directly
                delete baseData._id;
                delete baseData.folder;
                delete baseData.sort;
                delete baseData.ownership;
                if (baseData._stats) delete baseData._stats;
            } else {
                console.warn(`Bridge create_actor: base actor not found (id: ${params.baseActorId}, name: ${params.baseActorName})`);
            }
        }

        const overrideData: any = {
            name: params.name,
            type: params.type,
            system: params.system || {}
        };
        if (params.img) overrideData.img = params.img;

        const mergeFn = (globalThis as any).mergeObject || (globalThis as any).foundry?.utils?.mergeObject;
        const actorData = mergeFn
            ? mergeFn(baseData, overrideData, { inplace: false, insertKeys: true, insertValues: true })
            : Object.assign({}, baseData, overrideData); // fallback just in case

        if (params.folder) {
            actorData.folder = params.folder;
        }

        const newActor = await Actor.create(actorData);
        if (!newActor) throw new Error("Failed to create actor.");

        if (params.items && Array.isArray(params.items) && params.items.length > 0) {
            await newActor.createEmbeddedDocuments("Item", params.items);
        }

        // Return updated object
        return newActor.toObject();
    },

    edit: async (params: { id: string; updateData: any; itemsToAdd?: any[] }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit actors via Bridge.");

        const actor = game.actors?.get(params.id);
        if (!actor) throw new Error(`Actor with ID ${params.id} not found.`);

        const updatedActor = await actor.update(params.updateData);
        if (!updatedActor) throw new Error("Failed to update actor.");

        if (params.itemsToAdd && Array.isArray(params.itemsToAdd) && params.itemsToAdd.length > 0) {
            await updatedActor.createEmbeddedDocuments("Item", params.itemsToAdd);
        }

        return updatedActor.toObject();
    }
};
