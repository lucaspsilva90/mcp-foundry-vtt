// Types for Foundry VTT globals (partially declared by foundry-vtt-types)

export const ActorHandlers = {
    read: async (params: { id?: string; name?: string; type?: string; fields?: "minimal" | "full"; limit?: number; offset?: number }) => {
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

        const isMinimal = params.fields !== "full";
        const offset = params.offset || 0;
        const limit = params.limit || actors.length;

        let pagedActors = actors.slice(offset, offset + limit);

        if (isMinimal) {
            return pagedActors.map(a => ({ _id: a.id, name: a.name, type: a.type }));
        }

        return pagedActors.map(a => a.toObject());
    },

    create: async (params: { name: string; type: string; system?: any; img?: string; baseActorId?: string; baseActorName?: string; folder?: string; items?: any[] }) => {
        // Requires GM privileges typically
        if (!game.user?.isGM) throw new Error("Only GM can create actors via Bridge.");

        let baseData: any = {};
        if (params.baseActorId || params.baseActorName) {
            let baseActor: any = params.baseActorId ? game.actors?.get(params.baseActorId) : undefined;
            if (!baseActor && params.baseActorId && params.baseActorId.startsWith("Compendium.")) {
                baseActor = await (globalThis as any).fromUuid(params.baseActorId);
            }
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
    },

    clone: async (params: { sourceUuid: string; name?: string; hp?: number; folder?: string; attributes?: any }) => {
        if (!game.user?.isGM) throw new Error("Only GM can clone actors via Bridge.");

        let baseActor = await (globalThis as any).fromUuid(params.sourceUuid);
        if (!baseActor) {
            baseActor = game.actors?.get(params.sourceUuid);
        }
        if (!baseActor) throw new Error(`Actor with sourceUuid ${params.sourceUuid} not found.`);

        const updateData: any = {};
        if (params.name) updateData.name = params.name;
        if (params.folder) updateData.folder = params.folder;

        if (params.hp !== undefined) {
            updateData["system.attributes.hp.max"] = params.hp;
            updateData["system.attributes.hp.value"] = params.hp;
        }

        if (params.attributes) {
            Object.assign(updateData, params.attributes);
        }

        const clonedActor = await baseActor.clone(updateData, { save: true });
        return clonedActor.toObject();
    },

    addItems: async (params: { actorId: string; itemUuids: string[] }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit actors via Bridge.");
        const actor = game.actors?.get(params.actorId);
        if (!actor) throw new Error(`Actor with ID ${params.actorId} not found.`);

        const itemsData = [];
        for (const uuid of params.itemUuids) {
            let item = await (globalThis as any).fromUuid(uuid);
            if (!item) {
                item = game.items?.get(uuid);
            }
            if (item) {
                itemsData.push(item.toObject());
            } else {
                console.warn(`Bridge addItems: Item ${uuid} not found.`);
            }
        }

        if (itemsData.length > 0) {
            const added = await actor.createEmbeddedDocuments("Item", itemsData);
            return added.map((i: any) => i.toObject());
        }
        return [];
    },

    create5eAttack: async (params: { actorId: string; name: string; actionType: string; damageDices?: string; damageType?: string; saveAbility?: string; saveDc?: number; ability?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit actors via Bridge.");
        const actor = game.actors?.get(params.actorId);
        if (!actor) throw new Error(`Actor with ID ${params.actorId} not found.`);

        const activityId = (globalThis as any).foundry.utils.randomID();

        const activity: any = {
            _id: activityId,
            type: params.actionType === "save" ? "save" : (params.actionType === "heal" ? "heal" : (params.actionType === "util" ? "utility" : "attack")),
            name: params.name,
            activation: { type: "action", value: 1 },
            consumption: { targets: [] },
            duration: { units: "inst" },
            range: { units: "ft" },
            target: { template: { contiguous: false, units: "ft" }, affix: false }
        };

        if (params.actionType === "save") {
            activity.save = {
                ability: [params.saveAbility || "dex"],
                dc: { calculation: params.saveDc ? "" : "spellcasting", formula: params.saveDc?.toString() || "" }
            };
        } else if (params.actionType === "heal") {
            activity.healing = {
                number: null,
                denomination: null,
                types: [params.damageType || "healing"],
                custom: { enabled: true, formula: params.damageDices || "" }
            };
        } else if (params.actionType === "util") {
            // Utility action
        } else {
            activity.attack = {
                ability: params.ability || "",
                bonus: "",
                critical: { threshold: null },
                flat: false,
                type: { value: params.actionType, classification: "weapon" }
            };
        }

        if (params.damageDices && params.actionType !== "heal" && params.actionType !== "util") {
            activity.damage = {
                critical: { allow: false, bonus: "" },
                parts: [
                    {
                        custom: { enabled: true, formula: params.damageDices },
                        number: null,
                        denomination: 0,
                        bonus: "",
                        types: [params.damageType || "piercing"],
                        scaling: { mode: "", number: 1, formula: "" }
                    }
                ]
            };
        }

        const itemData: any = {
            name: params.name,
            type: ["save", "util", "heal"].includes(params.actionType) ? "feat" : "weapon",
            system: {
                activities: {
                    [activityId]: activity
                },
                description: { value: `<p>Generated via MCP create_5e_attack tool.</p>` }
            }
        };

        const added = await actor.createEmbeddedDocuments("Item", [itemData]);
        return added.map((i: any) => i.toObject());
    },

    create5eSpell: async (params: { actorId: string; name: string; level: number; school?: string; castingTime?: string; range?: string; target?: string; actionType?: string; damageDices?: string; damageType?: string; saveAbility?: string; saveDc?: number }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit actors via Bridge.");
        const actor = game.actors?.get(params.actorId);
        if (!actor) throw new Error(`Actor with ID ${params.actorId} not found.`);

        const itemData: any = {
            name: params.name,
            type: "spell",
            system: {
                level: params.level,
                school: params.school || "",
                description: { value: `<p>Generated via MCP create_5e_spell tool.</p>` }
            }
        };

        if (params.actionType && params.actionType !== "none") {
            const activityId = (globalThis as any).foundry.utils.randomID();
            const activity: any = {
                _id: activityId,
                type: params.actionType === "save" ? "save" : (params.actionType === "heal" ? "heal" : (params.actionType === "util" ? "utility" : "attack")),
                name: "Cast",
                activation: { type: "action", value: 1 },
                duration: { units: "inst" }
            };

            if (params.castingTime) {
                if (params.castingTime.toLowerCase().includes("bonus")) {
                    activity.activation.type = "bonus";
                }
            }

            if (params.actionType === "save") {
                activity.save = {
                    ability: [params.saveAbility || "dex"],
                    dc: { calculation: params.saveDc ? "" : "spellcasting", formula: params.saveDc?.toString() || "" }
                };
            } else if (params.actionType === "heal") {
                activity.healing = {
                    number: null,
                    denomination: null,
                    types: [params.damageType || "healing"],
                    custom: { enabled: true, formula: params.damageDices || "" }
                };
            } else if (params.actionType === "attack") {
                activity.attack = {
                    ability: "spellcasting",
                    bonus: "",
                    critical: { threshold: null },
                    flat: false,
                    type: { value: "rsak", classification: "spell" }
                };
            }

            if (params.damageDices && params.actionType !== "heal" && params.actionType !== "util") {
                activity.damage = {
                    critical: { allow: false, bonus: "" },
                    parts: [
                        {
                            custom: { enabled: true, formula: params.damageDices },
                            number: null,
                            denomination: 0,
                            bonus: "",
                            types: [params.damageType || "none"],
                            scaling: { mode: "", number: 1, formula: "" }
                        }
                    ]
                };
            }

            itemData.system.activities = { [activityId]: activity };
        }

        const added = await actor.createEmbeddedDocuments("Item", [itemData]);
        return added.map((i: any) => i.toObject());
    },

    updateStats: async (params: { actorId: string; abilities?: any; savingThrows?: string[]; skills?: string[]; cr?: number; alignment?: string; ac?: number }) => {
        if (!game.user?.isGM) throw new Error("Only GM can edit actors via Bridge.");
        const actor = game.actors?.get(params.actorId);
        if (!actor) throw new Error(`Actor with ID ${params.actorId} not found.`);

        const updateData: any = {};

        if (params.abilities) {
            for (const [prop, val] of Object.entries(params.abilities)) {
                updateData[`system.abilities.${prop}.value`] = val;
            }
        }

        if (params.savingThrows) {
            for (const ab of params.savingThrows) {
                updateData[`system.abilities.${ab}.proficient`] = 1;
            }
        }

        if (params.skills) {
            for (const sk of params.skills) {
                updateData[`system.skills.${sk}.value`] = 1;
            }
        }

        if (params.cr !== undefined) {
            updateData[`system.details.cr`] = params.cr;
        }

        if (params.alignment) {
            updateData[`system.details.alignment`] = params.alignment;
        }

        if (params.ac !== undefined) {
            updateData[`system.attributes.ac.flat`] = params.ac;
            updateData[`system.attributes.ac.calc`] = "flat";
        }

        const updatedActor = await actor.update(updateData);
        return updatedActor.toObject();
    },

    readSummary: async (params: { id?: string; name?: string; limit?: number; offset?: number }) => {
        let actors = game.actors?.contents || [];
        if (params.id) {
            actors = actors.filter(a => a.id === params.id);
            if (actors.length === 0) throw new Error(`Actor with ID ${params.id} not found.`);
        } else if (params.name) {
            actors = actors.filter(a => a.name?.toLowerCase().includes(params.name!.toLowerCase()));
        }

        const offset = params.offset || 0;
        const limit = params.limit || actors.length;
        let pagedActors = actors.slice(offset, offset + limit);

        return pagedActors.map(a => {
            const data = a.toObject();

            const minimalItems = (data.items || []).map((i: any) => {
                return {
                    _id: i._id,
                    name: i.name,
                    type: i.type
                };
            });

            return {
                _id: data._id,
                name: data.name,
                type: data.type,
                system: {
                    attributes: {
                        hp: data.system?.attributes?.hp,
                        ac: data.system?.attributes?.ac,
                        movement: data.system?.attributes?.movement
                    },
                    abilities: data.system?.abilities,
                    details: {
                        cr: data.system?.details?.cr,
                        type: data.system?.details?.type,
                        alignment: data.system?.details?.alignment
                    }
                },
                items: minimalItems
            };
        });
    },

    create5eMonster: async (params: {
        name: string; folder?: string; cr: number; hp: number; ac: number;
        movement: string; alignment: string; biography?: string; appearance?: string;
        size?: string; type?: string; abilities?: any;
        skills?: string[]; senses?: string; damageImmunities?: string; conditionImmunities?: string; languages?: string; habitat?: string;
    }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create actors via Bridge.");

        const combinedBiography = `
        ${params.biography ? `<p><strong>Biography:</strong> ${params.biography}</p>` : ""}
        ${params.appearance ? `<p><strong>Appearance:</strong> ${params.appearance}</p>` : ""}
        `;

        const actorData: any = {
            name: params.name,
            type: "npc",
            system: {
                attributes: {
                    hp: { value: params.hp, max: params.hp },
                    ac: { flat: params.ac, calc: "flat" },
                    movement: { special: params.movement },
                    senses: params.senses ? { special: params.senses } : undefined
                },
                details: {
                    cr: params.cr,
                    alignment: params.alignment,
                    biography: { value: combinedBiography },
                    type: { value: params.type || "humanoid" },
                    environment: params.habitat || ""
                },
                traits: {
                    size: params.size || "med",
                    di: params.damageImmunities ? { custom: params.damageImmunities } : undefined,
                    ci: params.conditionImmunities ? { custom: params.conditionImmunities } : undefined,
                    languages: params.languages ? { custom: params.languages } : undefined
                }
            }
        };

        if (params.abilities) {
            actorData.system.abilities = {};
            for (const [prop, val] of Object.entries(params.abilities)) {
                actorData.system.abilities[prop] = { value: val };
            }
        }

        if (params.skills) {
            actorData.system.skills = {};
            for (const sk of params.skills) {
                actorData.system.skills[sk] = { value: 1 };
            }
        }

        if (params.folder) actorData.folder = params.folder;

        const newActor = await Actor.create(actorData);
        if (!newActor) throw new Error("Failed to create monster.");

        return newActor.toObject();
    },

    create5eNpc: async (params: {
        name: string; folder?: string; biography: string; appearance: string;
        ideals?: string; bonds?: string; flaws?: string; alignment?: string; voice?: string;
        cr?: number; hp?: number; ac?: number; movement?: string; abilities?: any;
        skills?: string[]; senses?: string; damageImmunities?: string; conditionImmunities?: string; languages?: string; habitat?: string;
    }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create actors via Bridge.");

        const combinedBiography = `
        <p><strong>Biography & Lore:</strong> ${params.biography}</p>
        <p><strong>Appearance:</strong> ${params.appearance}</p>
        ${params.voice ? `<p><strong>Voice & Mannerisms:</strong> ${params.voice}</p>` : ""}
        ${params.ideals ? `<p><strong>Ideals:</strong> ${params.ideals}</p>` : ""}
        ${params.bonds ? `<p><strong>Bonds:</strong> ${params.bonds}</p>` : ""}
        ${params.flaws ? `<p><strong>Flaws:</strong> ${params.flaws}</p>` : ""}
        `;

        const actorData: any = {
            name: params.name,
            type: "npc",
            system: {
                details: {
                    alignment: params.alignment || "",
                    biography: { value: combinedBiography },
                    environment: params.habitat || ""
                },
                attributes: {},
                traits: {
                    di: params.damageImmunities ? { custom: params.damageImmunities } : undefined,
                    ci: params.conditionImmunities ? { custom: params.conditionImmunities } : undefined,
                    languages: params.languages ? { custom: params.languages } : undefined
                }
            }
        };

        if (params.hp !== undefined || params.ac !== undefined || params.movement !== undefined || params.senses !== undefined) {
            if (params.hp !== undefined) actorData.system.attributes.hp = { value: params.hp, max: params.hp };
            if (params.ac !== undefined) actorData.system.attributes.ac = { flat: params.ac, calc: "flat" };
            if (params.movement !== undefined) actorData.system.attributes.movement = { special: params.movement };
            if (params.senses !== undefined) actorData.system.attributes.senses = { special: params.senses };
        }

        if (params.cr !== undefined) {
            actorData.system.details.cr = params.cr;
        }

        if (params.abilities) {
            actorData.system.abilities = {};
            for (const [prop, val] of Object.entries(params.abilities)) {
                actorData.system.abilities[prop] = { value: val };
            }
        }

        if (params.skills) {
            actorData.system.skills = {};
            for (const sk of params.skills) {
                actorData.system.skills[sk] = { value: 1 };
            }
        }

        if (params.folder) actorData.folder = params.folder;

        const newActor = await Actor.create(actorData);
        if (!newActor) throw new Error("Failed to create NPC.");

        return newActor.toObject();
    },

    create5eEncounter: async (params: { name: string; type?: string; folder?: string }) => {
        if (!game.user?.isGM) throw new Error("Only GM can create actors via Bridge.");

        const actorData: any = {
            name: params.name,
            type: params.type || "encounter"
        };
        if (params.folder) actorData.folder = params.folder;

        const newActor = await Actor.create(actorData);
        if (!newActor) throw new Error("Failed to create Encounter actor.");

        return newActor.toObject();
    }
};
