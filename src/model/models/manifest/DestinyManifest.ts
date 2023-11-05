import type { AllDestinyManifestComponents, DestinyInventoryComponent, DestinyInventoryItemDefinition, DestinyItemReusablePlugsComponent, DestinyItemSocketsComponent } from "bungie-api-ts/destiny2";
import type { DeepsightMomentDefinition } from "manifest.deepsight.gg";
import Model from "model/Model";
import type Manifest from "model/models/Manifest";
import ProfileBatch from "model/models/ProfileBatch";
import { IManifest, ManifestItem } from "model/models/manifest/IManifest";
import Env from "utility/Env";
import Objects from "utility/Objects";
import type { Mutable } from "utility/Type";
import GetManifest from "utility/endpoint/bungie/endpoint/destiny2/GetManifest";
import type { AllDeepsightManifestComponents } from "utility/endpoint/deepsight/endpoint/GetDeepsightManifest";
import GetDeepsightManifestVersions from "utility/endpoint/deepsight/endpoint/GetDeepsightManifestVersions";
import GetDeepsightMomentDefinition from "utility/endpoint/deepsight/endpoint/GetDeepsightMomentDefinition";

const elapsed = IManifest.elapsed;
const CacheComponentKey = IManifest.CacheComponentKey;

declare module "bungie-api-ts/destiny2" {
	interface DestinyRecordDefinition {
		recordTypeName?: string;
	}

	interface AllDestinyManifestComponents {
		DestinyInventoryItemLiteDefinition: {
			[key: number]: DestinyInventoryItemDefinition;
		};
	}
}

type DestinyManifest = {
	[COMPONENT_NAME in keyof AllDestinyManifestComponents]: ManifestItem<COMPONENT_NAME>;
};

const DestinyManifest = Model.create("destiny manifest", {
	cache: "Global",
	version: async () => {
		const manifest = await GetManifest.query();
		const deepsightVersions = await GetDeepsightManifestVersions.query();
		return `${manifest.version},DeepsightMomentDefinition.${deepsightVersions.DeepsightMomentDefinition}-22.deepsight.gg`;
	},
	async generate (api) {
		const manifest = await GetManifest.query();
		const bungieComponentNames = Object.keys(manifest.jsonWorldComponentContentPaths.en) as (keyof AllDestinyManifestComponents)[];

		const DeepsightMomentDefinition = await GetDeepsightMomentDefinition.query();

		const moments = Object.values(DeepsightMomentDefinition) as DeepsightMomentDefinition[];
		const allComponentNames: (keyof AllDestinyManifestComponents | keyof AllDeepsightManifestComponents)[] = [...bungieComponentNames, "DeepsightMomentDefinition"];

		const totalLoad = allComponentNames.length * 2 + 1;

		api.emitProgress(0, "Allocating stores for manifest");
		const cacheKeys = allComponentNames.map(CacheComponentKey.get);

		await Model.cacheDB.upgrade((database, transaction) => {
			for (const cacheKey of cacheKeys) {
				if (database.objectStoreNames.contains(cacheKey))
					database.deleteObjectStore(cacheKey);

				const store = database.createObjectStore(cacheKey);

				switch (cacheKey) {
					case "manifest [DeepsightMomentDefinition]":
						if (!store.indexNames.contains("iconWatermark"))
							store.createIndex("iconWatermark", "iconWatermark");
						if (!store.indexNames.contains("id"))
							store.createIndex("id", "id", { unique: true });
						break;
					case "manifest [DestinyInventoryItemDefinition]":
						if (!store.indexNames.contains("iconWatermark"))
							store.createIndex("iconWatermark", "iconWatermark");
						if (!store.indexNames.contains("name"))
							store.createIndex("name", "displayProperties.name");
						break;
					case "manifest [DestinyRecordDefinition]":
						if (!store.indexNames.contains("icon"))
							store.createIndex("icon", "displayProperties.icon");
						if (!store.indexNames.contains("name"))
							store.createIndex("name", "displayProperties.name");
						break;
				}
			}
		});

		const replaceWatermarksByItemHash: Record<number, DeepsightMomentDefinition> =
			Object.fromEntries(moments.flatMap(moment => (moment.itemHashes ?? [])
				.map(itemHash => [itemHash, moment])));

		const deepsightMomentComponentName: keyof AllDeepsightManifestComponents = "DeepsightMomentDefinition";
		const deepsightMomentCacheKey = CacheComponentKey.get(deepsightMomentComponentName);
		await Model.cacheDB.transaction([deepsightMomentCacheKey], async transaction => {
			const startTime = performance.now();
			console.info(`Caching objects from ${deepsightMomentCacheKey}`);
			api.emitProgress((1 + bungieComponentNames.length * 2) / totalLoad, "Storing manifest");

			await transaction.clear(deepsightMomentCacheKey);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			for (const [itemId, itemValue] of Object.entries(DeepsightMomentDefinition)) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				await transaction.set(deepsightMomentCacheKey, itemId, itemValue as DeepsightMomentDefinition);
			}

			console.info(`Finished caching objects from ${deepsightMomentCacheKey} after ${elapsed(performance.now() - startTime)}`);
		});

		for (let i = 0; i < bungieComponentNames.length; i++) {
			const componentName = bungieComponentNames[i];
			const cacheKey = CacheComponentKey.get(componentName);

			let startTime = performance.now();
			console.info(`Downloading ${cacheKey}`);
			api.emitProgress((1 + i * 2) / totalLoad, "Downloading manifest");

			let data: AllDestinyManifestComponents[keyof AllDestinyManifestComponents];
			let tryAgain = true;
			for (let i = 0; i < 5 && tryAgain; i++) {
				tryAgain = false;
				data = await fetch(Env.DEEPSIGHT_ENVIRONMENT === "dev" ? `testiny/${componentName}.json` : `https://www.bungie.net${manifest.jsonWorldComponentContentPaths.en[componentName]}?corsfix=${i}`)
					.then(response => response.json())
					.catch(err => {
						if ((err as Error).message.includes("Access-Control-Allow-Origin")) {
							console.warn(`CORS error, trying again with a query string (attempt ${++i})`);
							tryAgain = true;
							return {};
						}

						throw err;
					}) as AllDestinyManifestComponents[keyof AllDestinyManifestComponents];
			}

			console.info(`Finished downloading ${cacheKey} after ${elapsed(performance.now() - startTime)}`);
			startTime = performance.now();
			console.info(`Storing objects from ${cacheKey}`);
			api.emitProgress((1 + i * 2 + 1) / totalLoad, "Storing manifest");

			await Model.cacheDB.transaction([cacheKey], async transaction => {
				await transaction.clear(cacheKey);

				for (const [key, definition] of Object.entries(data)) {
					if (cacheKey === "manifest [DestinyInventoryItemDefinition]") {
						const itemDef = definition as Mutable<DestinyInventoryItemDefinition>;
						// fix red war items that don't have watermarks for some reason
						const replacementMoment = replaceWatermarksByItemHash[definition.hash];
						if (replacementMoment) {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							itemDef.iconWatermark = replacementMoment.iconWatermark!;
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							itemDef.iconWatermarkShelved = replacementMoment.iconWatermarkShelved!;
						} else if (!itemDef.iconWatermark && itemDef.quality?.displayVersionWatermarkIcons.length) {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							itemDef.iconWatermark = itemDef.quality.displayVersionWatermarkIcons[0];
						}
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					await transaction.set(cacheKey, key, definition);
				}
			});

			console.info(`Finished caching objects from ${cacheKey} after ${elapsed(performance.now() - startTime)}`);
		}

		return [...bungieComponentNames, "DeepsightMomentDefinition" as const];
	},
	process: async (componentNames) => {
		const Manifest = Object.fromEntries(componentNames
			.map(componentName => [componentName, new ManifestItem(componentName, DestinyManifest)])) as any as Manifest;

		for (const componentName of componentNames)
			if (componentName !== "DestinyInventoryItemDefinition" && componentName !== "DestinyInventoryItemLiteDefinition")
				Manifest[componentName].setPreCache(true);

		////////////////////////////////////
		// precache item hashes from profile
		const profile = await ProfileBatch.await();

		const itemHashes = new Set((profile.profileInventory?.data?.items.map(item => item.itemHash) ?? [])
			.concat(Object.values<DestinyInventoryComponent>(profile.characterInventories?.data ?? Objects.EMPTY)
				.concat(Object.values<DestinyInventoryComponent>(profile.characterEquipment?.data ?? Objects.EMPTY))
				.flatMap(inventory => inventory.items.map(item => item.itemHash))));

		for (const itemSockets of Object.values<DestinyItemSocketsComponent>(profile.itemComponents?.sockets.data ?? Objects.EMPTY)) {
			for (const socket of itemSockets.sockets ?? [])
				if (socket.plugHash)
					itemHashes.add(socket.plugHash);
		}

		for (const itemPlugsByItems of Object.values<DestinyItemReusablePlugsComponent>(profile.itemComponents?.reusablePlugs.data ?? Objects.EMPTY)) {
			for (const plugs of Object.values(itemPlugsByItems.plugs))
				for (const plug of plugs)
					itemHashes.add(plug.plugItemHash);
		}

		Manifest.DestinyInventoryItemDefinition.setPreCache([...itemHashes], async (cache, cacheKeyRange) => {
			////////////////////////////////////
			// precache plug items from cached item defs
			let values = Object.values(cache);
			const itemHashes = new Set<number>();

			for await (const itemDef of values)
				if (itemDef?.inventory?.recipeItemHash)
					if (!cache[`/:${itemDef.inventory.recipeItemHash}`])
						itemHashes.add(itemDef.inventory.recipeItemHash);

			await cacheKeyRange([...itemHashes]);
			itemHashes.clear();

			values = Object.values(cache);
			for await (const itemDef of values) {
				for (const socketEntry of itemDef?.sockets?.socketEntries ?? []) {
					if (!cache[`/:${socketEntry.singleInitialItemHash}`])
						itemHashes.add(socketEntry.singleInitialItemHash);

					for (const plug of socketEntry.reusablePlugItems)
						if (!cache[`/:${plug.plugItemHash}`])
							itemHashes.add(plug.plugItemHash);

					let plugSet = await Manifest.DestinyPlugSetDefinition.get(socketEntry.reusablePlugSetHash);
					for (const plugItem of plugSet?.reusablePlugItems ?? [])
						if (!cache[`/:${plugItem.plugItemHash}`])
							itemHashes.add(plugItem.plugItemHash);

					plugSet = await Manifest.DestinyPlugSetDefinition.get(socketEntry.randomizedPlugSetHash);
					for (const plugItem of plugSet?.reusablePlugItems ?? [])
						if (!cache[`/:${plugItem.plugItemHash}`])
							itemHashes.add(plugItem.plugItemHash);
				}
			}

			return cacheKeyRange([...itemHashes]);
		});

		Object.assign(window, { Manifest, DestinyManifest: Manifest });
		return Manifest;
	},
	reset: async componentNames => {
		for (const componentName of componentNames ?? []) {
			await Model.cacheDB.clear(CacheComponentKey.get(componentName));
			await Model.cacheDB.delete("models", IManifest.CacheComponentKey.getBundle(componentName));
		}
	},
	cacheInvalidated: async componentNames => {
		for (const componentName of componentNames ?? []) {
			await Model.cacheDB.delete("models", IManifest.CacheComponentKey.getBundle(componentName));
		}
	},
});

export default DestinyManifest;
