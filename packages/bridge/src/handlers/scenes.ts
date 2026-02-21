export const SceneHandlers = {
    read: async (params: { id?: string; name?: string }) => {
        if (params.id) {
            const scene = game.scenes?.get(params.id);
            if (!scene) throw new Error(`Scene with ID ${params.id} not found.`);
            return scene.toObject();
        }

        let scenes = game.scenes?.contents || [];
        if (params.name) {
            scenes = scenes.filter(s => s.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        return scenes.map(s => s.toObject());
    },

    create: async (params: { name: string; background: string; width?: number; height?: number }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create scenes via Bridge.");

        const sceneData = {
            name: params.name,
            background: { src: params.background },
            width: params.width || 4000,
            height: params.height || 3000
        };

        const newScene = await Scene.create(sceneData);
        if (!newScene) throw new Error("Failed to create scene.");
        return newScene.toObject();
    },

    edit: async (params: { id: string; updateData: any; activate?: boolean }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit/activate scenes via Bridge.");

        const scene = game.scenes?.get(params.id);
        if (!scene) throw new Error(`Scene with ID ${params.id} not found.`);

        if (params.updateData && Object.keys(params.updateData).length > 0) {
            await scene.update(params.updateData);
        }

        if (params.activate) {
            await scene.view(); // View the scene
            await scene.activate(); // Activate it for players
        }

        return scene.toObject();
    }
};
