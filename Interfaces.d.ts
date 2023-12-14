export declare interface DeepsightDisplayPropertiesDefinition {
	name?: string;
	description?: string;
	/**
	 * Icon paths are guaranteed to either be via Bungie.net or deepsight.gg.
	 * - Bungie.net icon paths always begin with `/` and should be appended to `https://www.bungie.net`
	 * - deepsight.gg icon paths always begin with `./` should be joined with `https://deepsight.gg`
	 */
	icon?: DeepsightIconPath | BungieIconPath;
}

export declare type DeepsightIconPath = `./${string}`;
export declare type BungieIconPath = `/${string}`;

export declare interface DeepsightDropTableDefinition {
	/**
	 * `DestinyActivityDefinition` hash.
	 * Refers to the version of the raid that's always available.
	 */
	hash: number;
	/**
	 * `DestinyActivityDefinition` hash.
	 * Refers to the version of the raid that rotates in and has all challenges available (if different.)
	 */
	rotationActivityHash?: number;
	/**
	 * A record for completing this activity.
	 */
	recordHash?: number;
	/**
	 * Partial display properties. Not all fields are guaranteed to be provided.
	 */
	displayProperties?: DeepsightDisplayPropertiesDefinition;
	/**
	 * A drop table used as the base drop table for all encounters. Encounter-specific drop tables may override this.
	 */
	dropTable?: Record<number, DeepsightDropTableDropDefinition>;
	/**
	 * If this activity has encounters, information about them will be here.
	 */
	encounters?: DeepsightDropTableEncounterDefinition[];
	/**
	 * If the activity has a high level variant which drops different loot, it's defined here.
	 */
	master?: DeepsightDropTableMasterDefinition;
	/**
	 * If challenges or drops rotate, this field will be filled.
	 */
	rotations?: DeepsightDropTableRotationsDefinition;
}

export declare interface DeepsightDropTableEncounterDefinition {
	/**
	 * Phase hashes are based on data from `characterProgressions.milestones[milestone hash].activities[activity index].phases`
	 */
	phaseHash: number;
	/**
	 * Every encounter is guaranteed to have a partial display properties object.
	 */
	displayProperties: DeepsightDisplayPropertiesDefinition;
	/**
	 * Determines the way that this encounter's drop table should be applied to the base activity drop table.
	 * - "replace" = this encounter-specific drop table should be used instead of the base drop table.
	 * - "merge" = this encounter-specific drop table should be merged into the base drop table.
	 * If not provided, it should default to "merge". 
	 */
	dropTableMergeStrategy?: "replace" | "merge";
	/**
	 * Encounter-specific drop table.
	 */
	dropTable?: Record<number, DeepsightDropTableDropDefinition>;
}

export declare interface DeepsightDropTableMasterDefinition {
	/**
	 * `DestinyActivityDefinition` hash for the master activity.
	 */
	activityHash: number;
	/**
	 * A non-rotating drop table of items from the master activity.
	 */
	dropTable?: Record<number, DeepsightDropTableDropDefinition>;
}

export declare interface DeepsightDropTableDropDefinition {
	/**
	 * `DestinyInventoryItemDefinition` hash representing a quest item required for this drop to drop.
	 */
	requiresQuest?: number;
	/**
	 * `DestinyInventoryItemDefinition` hashes representing a list of items required for this drop to drop.
	 */
	requiresItems?: number[];
	/**
	 * `true` if this item is only available for purchase in an end-of-activity cache.
	 */
	purchaseOnly?: true;
}

export declare interface DeepsightDropTableRotationsDefinition {
	/**
	 * Unix timestamp (ms) of a Destiny reset, referring to the following week's rotation.
	 */
	anchor: number;
	/**
	 * `DestinyInventoryItemDefinition` hashes.
	 * The first drop will be the active drop during the week of the anchor reset, then the next drop the next week,
	 * and so on until all drops are exhausted. At that point, it cycles back to the first drop.
	 */
	drops?: number[];
	/**
	 * `DestinyInventoryItemDefinition` hashes.
	 * The first drop will be the active drop during the week of the anchor reset, then the next drop the next week,
	 * and so on until all drops are exhausted. At that point, it cycles back to the first drop.
	 */
	masterDrops?: number[];
	/**
	 * `DestinyActivityModifierDefinition` hashes.
	 * The first challenge will be the active challenge during the week of the anchor reset, then the next challenge the next week,
	 * and so on until all challenges are exhausted. At that point, it cycles back to the first challenge.
	 */
	challenges?: number[];
}

export declare interface DeepsightMomentDefinition {
	hash: number;
	id: string;
	displayProperties: DeepsightDisplayPropertiesDefinition;
	iconWatermark?: string;
	iconWatermarkShelved?: string;
	/**
	 * For events, the event card hash. If there isn't an event card, `true`
	 */
	event?: true | number;
	expansion?: true;
	season?: number;
	year?: number;
	seasonHash?: number;
	/**
	 * Items that should be associated with this moment, but aren't according to the Destiny manifest (by icon watermark).
	 * You should render these items with this moment's `iconWatermark`.
	 */
	itemHashes?: number[];
}

/**
 * Destiny 2 wallpapers Bungie has released indexed by `DeepsightMomentDefinition` hashes.
 */
export declare interface DeepsightWallpaperDefinition {
	/**
	 * A `DeepsightMomentDefinition` hash.
	 */
	hash: number;
	/**
	 * Wallpaper URLs. Each is an absolute (full) URL.
	 */
	wallpapers: string[];
}

export interface DeepsightTierTypeDefinition {
	hash: number;
	tierType: number;
	displayProperties: DeepsightDisplayPropertiesDefinition;
}
