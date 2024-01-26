import type { ActivityHashes, DamageTypeHashes, InventoryBucketHashes, InventoryItemHashes, StatHashes } from "@deepsight.gg/enums";

export enum DeepsightPlugCategory {
	None,
	Intrinsic,
	Perk,
	Mod,
	Subclass,
	Artifact,
	Cosmetic,
	Masterwork,
	Vendor,
	Classified,
	StatusEffect,
	Unknown,
	Extractable,
	Infusion,
}

export enum DeepsightPlugTypeIntrinsic {
	None,
	Frame,
	FrameEnhanced,
	Origin,
	Exotic,
	SparrowEngine,
}

export enum DeepsightPlugTypePerk {
	None,
	Trait,
	TraitEnhanced,
	Exotic,
	Scope,
	Barrel,
	Battery,
	Magazine,
	Grip,
	Stock,
	Blade,
	Guard,
	Bowstring,
	Arrow,
	GrenadeLauncherMagazine,
	Tube,
	Haft,
	Deprecated,
	Dummy,
	Clan,
	Sparrow,
	Ship,
	Ghost,
	TraitLocked,
	EmptyCraftingSocket,
	EmblemAura,
	Random,
}

export enum DeepsightPlugTypeMod {
	None,
	Armor,
	ArmorEmpty,
	Weapon,
	WeaponAdept,
	WeaponEmpty,
	Ghost,
	GhostEmpty,
	Universal,
	UniversalEmpty,
	Deprecated,
	Fallback,
	ArmorLocked,
	ArmorExotic,
}

export enum DeepsightPlugTypeSubclass {
	None,
	Aspect,
	Fragment,
	FragmentEmpty,
	Super,
	Grenade,
	Melee,
	ClassAbility,
	Movement,
	SuperEmpty,
	AspectEmpty,
	GrenadeEmpty,
	MeleeEmpty,
	ClassAbilityEmpty,
	MovementEmpty,
}

export enum DeepsightPlugTypeCosmetic {
	None,
	Shader,
	OrnamentWeapon,
	Memento,
	Emote,
	TransmatEffect,
	GhostShell,
	GhostProjection,
	ShipEngineEffect,
	Tracker,
	ArmorGlow,
	GhostTracker,
	ClanBannerStaff,
	EmblemEmpty,
	Radiance,
	OrnamentDefault,
	MementoEmpty,
	OrnamentArmor,
	OrnamentArmorExotic,
	OrnamentWeaponExotic,
	OrnamentMask,
	ShaderDefault,
}

export enum DeepsightPlugTypeMasterwork {
	None,
	Weapon,
	Armor,
	Ghost,
	ExoticCatalystEmpty,
	ExoticCatalystUpgrade,
	ExoticCatalystAvailable,
	ExoticCatalyst,
	Event,
	ShapedWeapon,
	HolidayOven,
	Authorization,
	EnhancementEmpty,
	Enhancement,
}

export enum DeepsightPlugTypeVendor {
	None,
	HolidayOven,
}

export enum DeepsightPlugTypeExtractable {
	None,
	DeepsightResonance,
	DeepsightActivation,
}

export const DeepsightPlugTypeMap = {
	[DeepsightPlugCategory.None]: null,
	[DeepsightPlugCategory.Classified]: null,
	[DeepsightPlugCategory.Unknown]: null,
	[DeepsightPlugCategory.Intrinsic]: /*%typeof*/ DeepsightPlugTypeIntrinsic,
	[DeepsightPlugCategory.Perk]: /*%typeof*/ DeepsightPlugTypePerk,
	[DeepsightPlugCategory.Mod]: /*%typeof*/ DeepsightPlugTypeMod,
	[DeepsightPlugCategory.Subclass]: /*%typeof*/ DeepsightPlugTypeSubclass,
	[DeepsightPlugCategory.Cosmetic]: /*%typeof*/ DeepsightPlugTypeCosmetic,
	[DeepsightPlugCategory.Masterwork]: /*%typeof*/ DeepsightPlugTypeMasterwork,
	[DeepsightPlugCategory.Artifact]: null,
	[DeepsightPlugCategory.Vendor]: /*%typeof*/ DeepsightPlugTypeVendor,
	[DeepsightPlugCategory.StatusEffect]: null,
	[DeepsightPlugCategory.Infusion]: null,
	[DeepsightPlugCategory.Extractable]: /*%typeof*/ DeepsightPlugTypeExtractable,
};

export type DeepsightPlugType<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> =
	DeepsightPlugCategory extends CATEGORY ? ({ [CATEGORY in DeepsightPlugCategory]: DeepsightPlugType<CATEGORY> } extends infer ALL_CATEGORIES ? ALL_CATEGORIES[keyof ALL_CATEGORIES] : never)
	: (/*<*/typeof /*>*/DeepsightPlugTypeMap)[CATEGORY] extends infer TYPE_ENUM ? TYPE_ENUM[keyof TYPE_ENUM] : never;

export interface DeepsightPlugCategorisationGeneric<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> {
	hash: number;
	category: CATEGORY;
	categoryName: string;
	type?: DeepsightPlugType<CATEGORY>;
	typeName?: string;
	fullName: DeepsightPlugFullName<CATEGORY>;
}

export interface DeepsightPlugCategorisationMasterwork extends DeepsightPlugCategorisationGeneric<DeepsightPlugCategory.Masterwork> {
	complete?: boolean;
	stat?: StatHashes;
	value?: number;
}

export interface DeepsightItemInvestmentStatDefinition {
	statTypeHash: number;
	/**
	 * Either a static value, or an array of numbers which is how much the total value of stat is from the equipped copies of the mod.
	 * IE, [30, 50, 60] for 1, 2, and 3 armour charge mods equipped.
	 */
	value: number | number[];
	isConditionallyActive: boolean;
}

export interface DeepsightPlugCategorisationMod extends DeepsightPlugCategorisationGeneric<DeepsightPlugCategory.Mod> {
	adept?: boolean;
	bucketHash?: InventoryBucketHashes;
	raid?: boolean;
	artifice?: boolean;
	activityHash?: ActivityHashes;
	armourChargeStats?: DeepsightItemInvestmentStatDefinition[];
}

export interface DeepsightPlugCategorisationSubclass extends DeepsightPlugCategorisationGeneric<DeepsightPlugCategory.Subclass> {
	damageType?: DamageTypeHashes;
	subclasses?: InventoryItemHashes[];
	affectsClassStat?: true;
}

interface DeepsightPlugCategorisationMap {
	[DeepsightPlugCategory.Masterwork]: DeepsightPlugCategorisationMasterwork;
	[DeepsightPlugCategory.Mod]: DeepsightPlugCategorisationMod;
	[DeepsightPlugCategory.Subclass]: DeepsightPlugCategorisationSubclass;
}

export type DeepsightPlugCategorisation<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> =
	DeepsightPlugCategory extends CATEGORY ? ({ [CATEGORY in DeepsightPlugCategory]: DeepsightPlugCategorisation<CATEGORY> } extends infer ALL_CATEGORIES ? ALL_CATEGORIES[keyof ALL_CATEGORIES] : never)
	: DeepsightPlugCategorisationMap extends { [KEY in CATEGORY]: infer CATEGORISATION } ? CATEGORISATION : DeepsightPlugCategorisationGeneric<CATEGORY>;

type ReverseCategoryMap = { [KEY in keyof typeof DeepsightPlugCategory as (typeof DeepsightPlugCategory)[KEY] extends infer ORDINAL extends number ? ORDINAL : never]: KEY }

export type DeepsightPlugCategoryName = ReverseCategoryMap[keyof ReverseCategoryMap];

export type DeepsightPlugFullName<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> =
	DeepsightPlugCategory extends CATEGORY ? ({ [CATEGORY in DeepsightPlugCategory]: DeepsightPlugFullName<CATEGORY> } extends infer ALL_CATEGORIES ? ALL_CATEGORIES[keyof ALL_CATEGORIES] : never)
	: (/*<*/typeof /*>*/DeepsightPlugTypeMap)[CATEGORY] extends infer TYPE_ENUM ? TYPE_ENUM extends null ? `${ReverseCategoryMap[CATEGORY]}`
	: `${ReverseCategoryMap[CATEGORY]}/${Extract<keyof TYPE_ENUM, string>}` : never;
