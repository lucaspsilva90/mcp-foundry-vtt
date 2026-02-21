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

    create: async (params: { name: string; type: string; system?: any; img?: string }) => {
        // Requires GM privileges typically
        if (!game.user?.isGM) throw new Error("Only GM can create actors via Bridge.");

        const actorData = {
            name: params.name,
            type: params.type,
            img: params.img,
            system: params.system || {}
        };

        const newActor = await Actor.create(actorData);
        if (!newActor) throw new Error("Failed to create actor.");
        return newActor.toObject();
    },

    edit: async (params: { id: string; updateData: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit actors via Bridge.");

        const actor = game.actors?.get(params.id);
        if (!actor) throw new Error(`Actor with ID ${params.id} not found.`);

        const updatedActor = await actor.update(params.updateData);
        if (!updatedActor) throw new Error("Failed to update actor.");
        return updatedActor.toObject();
    }
};
