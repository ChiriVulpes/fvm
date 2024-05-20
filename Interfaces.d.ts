import type { DestinyDisplayCategoryDefinition, DestinyDisplayPropertiesDefinition, DestinyItemComponentSetOfint32, DestinyItemQuantity, DestinyVendorItemDefinition, DestinyVendorLocationDefinition, TierType } from "bungie-api-ts/destiny2";
import type { ActivityHashes, ActivityModifierHashes, EventCardHashes, InventoryBucketHashes, InventoryItemHashes, ItemTierTypeHashes, MomentHashes, SeasonHashes, VendorGroupHashes, VendorHashes } from "./Enums";

export declare type ISOString = `${bigint}-${"0" | ""}${bigint}-${"0" | ""}${bigint}T${"0" | ""}${bigint}:${"0" | ""}${bigint}:${"0" | ""}${bigint}Z`;

export declare interface DeepsightManifest {
	/**
	 * This number increments whenever any other property changes (excluding Destiny2/Manifest)
	 */
	deepsight: number;
	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the last time any property has changed
	 */
	updated: ISOString;

	DeepsightDropTableDefinition: number;
	DeepsightMomentDefinition: number;
	DeepsightPlugCategorisation: number;
	DeepsightWallpaperDefinition: number;
	DeepsightTierTypeDefinition: number;
	Enums: number;
	Interfaces: number;

	/**
	 * The version of the Destiny manifest the current deepsight manifest supports
	 */
	"Destiny2/Manifest": string;

	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the last daily reset from when this manifest was last updated.  
	 * 
	 * **Note that this is only set after 30 minutes, at minimum, sometimes longer.**
	 */
	lastDailyReset: ISOString;
	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the last weekly reset from when this manifest was last updated.  
	 * 
	 * **Note that this is only set after 30 minutes, at minimum, sometimes longer.**
	 */
	lastWeeklyReset: ISOString;
	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the last Trials reset from when this manifest was last updated.
	 * When Trials is not active, this is the start of Trials on the previous week.
	 * 
	 * **Note that this does not take into account weeks when Trials is not active at all, such as when Iron Banner replaces it.**  
	 * 
	 * **Note that this is only set after 30 minutes, at minimum, sometimes longer.**
	 */
	lastTrialsReset: ISOString;

	/**
	 * The `instanceId` and `period` datetime of a PGCR created since the last daily reset. 
	 * 
	 * **Note that this is only set after 30 minutes, at minimum, sometimes longer.**
	 * 
	 * For reference, the PGCR chosen is generally not notable in any way, 
	 * it's simply the first PGCR that a binary search happened to stumble upon in the correct day.
	 */
	referencePostGameCarnageReportSinceDailyReset: DeepsightManifestReferencePGCR;
}

export declare interface DeepsightManifestReferencePGCR {
	instanceId: `${bigint}`;
	period: ISOString;
}

export declare interface DeepsightDisplayPropertiesDefinition {
	name?: string;
	subtitle?: string;
	description?: string;
	/**
	 * Icon paths are guaranteed to either be via Bungie.net or deepsight.gg.
	 * - Bungie.net icon paths always begin with `/` and should be appended to `https://www.bungie.net`
	 * - deepsight.gg icon paths always begin with `./` should be joined with `https://deepsight.gg`
	 */
	icon?: DeepsightIconPath | BungieIconPath;
	/**
	 * Icon paths are guaranteed to either be via Bungie.net or deepsight.gg.
	 * - Bungie.net icon paths always begin with `/` and should be appended to `https://www.bungie.net`
	 * - deepsight.gg icon paths always begin with `./` should be joined with `https://deepsight.gg`
	 */
	largeIcon?: DeepsightIconPath | BungieIconPath;
}

export declare type DeepsightIconPath = `./${string}`;
export declare type BungieIconPath = `/${string}`;

export declare interface DeepsightDropTableDefinition {
	/**
	 * `DestinyActivityDefinition` hash.
	 * Refers to the version of the activity that's always available.
	 */
	hash: ActivityHashes;
	/**
	 * `DestinyActivityDefinition` hash.
	 * Refers to the version of the activity that rotates in (if different.)
	 * 
	 * In the case of raids, this refers to the activity definition that lists all challenges available.
	 */
	rotationActivityHash?: ActivityHashes;
	/**
	 * Partial display properties. Not all fields are guaranteed to be provided.
	 */
	displayProperties?: DeepsightDisplayPropertiesDefinition;
	/**
	 * A drop table used as the base drop table for all encounters. Encounter-specific drop tables may override this.
	 */
	dropTable?: Partial<Record<InventoryItemHashes, DeepsightDropTableDropDefinition>>;
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

	/**
	 * If this activity is only available for a certain period of time, this specifies whether it's available as a rotator or whether it's a repeatable activity (IE, the most recent ones)
	 */
	availability?: "rotator" | "repeatable";
	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the time when this activity will no longer be available
	 */
	endTime?: ISOString;
	/**
	 * The type of activity as a string
	 */
	type: "nightfall" | "trials" | "dungeon" | "raid" | "lost-sector" | "exotic-mission";
	/**
	 * Partial display properties. Not all fields are guaranteed to be provided.
	 */
	typeDisplayProperties: DeepsightDisplayPropertiesDefinition;
}

export declare interface DeepsightDropTableEncounterDefinition {
	/**
	 * Phase hashes are based on data from `characterProgressions.milestones[milestone hash].activities[activity index].phases`
	 */
	phaseHash?: number;
	/**
	 * True if this is a traversal phase (not a real encounter)
	 */
	traversal?: true;
	/**
	 * Every encounter is guaranteed to have a partial display properties object.
	 */
	displayProperties: DeepsightDisplayPropertiesDefinition & {
		/**
		 * An alternative title for the encounter, generally wordier.
		 */
		directive?: string;
	};
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
	dropTable?: Partial<Record<InventoryItemHashes, DeepsightDropTableDropDefinition>>;
}

export declare interface DeepsightDropTableMasterDefinition {
	/**
	 * `DestinyActivityDefinition` hash for the master activity.
	 */
	activityHash: ActivityHashes;
	/**
	 * A non-rotating drop table of items from the master activity.
	 */
	dropTable?: Partial<Record<InventoryItemHashes, DeepsightDropTableDropDefinition>>;
	/**
	 * If this activity is only available for a certain period of time, this specifies whether it's available as a rotator or whether it's a repeatable activity (IE, the most recent ones)
	 */
	availability?: "rotator" | "repeatable";
}

export declare interface DeepsightDropTableDropDefinition {
	/**
	 * `DestinyInventoryItemDefinition` hash representing a quest item required for this drop to drop.
	 */
	requiresQuest?: InventoryItemHashes;
	/**
	 * `DestinyInventoryItemDefinition` hashes representing a list of items required for this drop to drop.
	 */
	requiresItems?: InventoryItemHashes[];
	/**
	 * `true` if this item is only available for purchase in an end-of-activity cache.
	 */
	purchaseOnly?: true;
}

export declare interface DeepsightDropTableRotationsDefinition {
	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the time the rotations start from.
	 */
	anchor: ISOString;
	/**
	 * Whether this rotation is daily or weekly.
	 */
	interval: "daily" | "weekly";
	/**
	 * The current index into `drops`, `masterDrops`, and `challenges`. This will no longer be valid when the interval ends.
	 * 
	 * This can't be used directly as an index into the arrays, and must first be normalised to the respective array's length.
	 * IE: `drops[current % drops.length]`
	 */
	current: number;
	/**
	 * A datetime string in the ISO format, yyyy-mm-ddThh:mm:ssZ, representing the time the current rotation will change to the next one.
	 */
	next: ISOString;
	/**
	 * An array of drop table objects (containing all possible drops) or `DestinyInventoryItemDefinition` hashes (for a single drop).
	 * 
	 * The first item in the array will be the active drop(s) during the week of the anchor reset, then the next drop the next week,
	 * and so on until all drops are exhausted. At that point, it cycles back to the first drop.
	 */
	drops?: (Partial<Record<InventoryItemHashes, DeepsightDropTableDropDefinition>> | InventoryItemHashes)[];
	/**
	 *  An array of drop table objects (containing all possible drops) or `DestinyInventoryItemDefinition` hashes (for a single drop).
	 * 
	 * The first item in the array will be the active drop(s) during the week of the anchor reset, then the next drop the next week,
	 * and so on until all drops are exhausted. At that point, it cycles back to the first drop.
	 */
	masterDrops?: (Partial<Record<InventoryItemHashes, DeepsightDropTableDropDefinition>> | InventoryItemHashes)[];
	/**
	 * `DestinyActivityModifierDefinition` hashes.
	 * The first challenge will be the active challenge during the week of the anchor reset, then the next challenge the next week,
	 * and so on until all challenges are exhausted. At that point, it cycles back to the first challenge.
	 */
	challenges?: ActivityModifierHashes[];
}

export declare interface DeepsightMomentDefinition {
	hash: MomentHashes;
	id: string;
	displayProperties: DeepsightDisplayPropertiesDefinition;
	iconWatermark?: string;
	iconWatermarkShelved?: string;
	/**
	 * For events, the event card hash. If there isn't an event card, `true`
	 */
	event?: true | EventCardHashes;
	expansion?: true;
	season?: number;
	year?: number;
	seasonHash?: SeasonHashes;
	/**
	 * Items that should be associated with this moment, but aren't according to the Destiny manifest (by icon watermark).
	 * You should render these items with this moment's `iconWatermark`.
	 */
	itemHashes?: InventoryItemHashes[];
}

/**
 * Destiny 2 wallpapers Bungie has released indexed by `DeepsightMomentDefinition` hashes.
 */
export declare interface DeepsightWallpaperDefinition {
	/**
	 * A `DeepsightMomentDefinition` hash.
	 */
	hash: MomentHashes;
	/**
	 * Wallpaper URLs. Each is an absolute (full) URL.
	 */
	wallpapers: string[];
	/**
	 * Wallpaper URLs. Each is an absolute (full) URL.
	 * 
	 * Secondary wallpapers are generally Bungie's press screenshots, 
	 * but some other wallpapers are curated into or out of this list by deepsight.gg.  
	 * If you want wallpapers that are good for displaying behind application UI, you want `wallpapers`, not `secondaryWallpapers`.
	 */
	secondaryWallpapers: string[];
}

export declare interface DeepsightTierTypeDefinition {
	/**
	 * A `DestinyItemTierTypeDefinition` hash.
	 */
	hash: ItemTierTypeHashes;
	/**
	 * The `TierType` of this tier, as appears in `DestinyInventoryItemDefinition`'s `inventory.tierType`.
	 */
	tierType: TierType;
	/**
	 * Partial display properties. Not all fields are guaranteed to be provided.
	 */
	displayProperties: DeepsightDisplayPropertiesDefinition;
}

export declare interface DeepsightVendorDefinition {
	/**
	 * A `DestinyVendorDefinition` hash.
	 */
	hash: VendorHashes;
	/**
	 * Partial display properties. Not all fields are guaranteed to be provided.
	 */
	displayProperties: DeepsightDisplayPropertiesDefinition;
	/**
	 * A 1920x1080 background for this image, taken in-game, if the vendor has one.
	 */
	background?: DeepsightIconPath;
	/**
	 * The current location of the vendor.
	 */
	location: DestinyVendorLocationDefinition;
	/**
	 * An array of `DestinyVendorGroupDefinition` hashes.
	 */
	groups: VendorGroupHashes[];
	categories: DeepsightVendorCategoryEntryDefinition[];
	/**
	 * The last moment this vendor was active in.
	 */
	moment?: MomentHashes;
}

export declare interface DeepsightVendorCategoryEntryDefinition extends DestinyDisplayCategoryDefinition {
	items: DeepsightVendorItemDefinition[];
}

export declare interface DeepsightVendorItemDefinition extends DestinyVendorItemDefinition {
	displayProperties: DestinyDisplayPropertiesDefinition;
	quantity: number;
	overrideNextRefreshDate?: string;
	apiPurchasable?: boolean;
	costs?: DestinyItemQuantity[];
	itemComponent: DestinyItemComponentSetOfint32;
}

export declare interface DeepsightStats {
	powerFloor: number;
}

export declare interface DeepsightCollectionsDefinition {
	hash: MomentHashes;
	buckets: Partial<Record<InventoryBucketHashes, InventoryItemHashes[]>>;
}
export declare type DeepsightCollectionsDefinitionManifest = Partial<Record<MomentHashes, DeepsightCollectionsDefinition>>;

export interface DeepsightAdeptDefinition {
	hash: InventoryItemHashes;
	base: InventoryItemHashes;
}
