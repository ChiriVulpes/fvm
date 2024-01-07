import type { ActivityHashes, DamageTypeHashes, InventoryBucketHashes, InventoryItemHashes, StatHashes } from "./Enums";

export declare const enum DeepsightPlugCategory {
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

export declare const enum DeepsightPlugTypeIntrinsic {
	None,
	Frame,
	FrameEnhanced,
	Origin,
	Exotic,
	SparrowEngine,
}

export declare const enum DeepsightPlugTypePerk {
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

export declare const enum DeepsightPlugTypeMod {
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

export declare const enum DeepsightPlugTypeSubclass {
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

export declare const enum DeepsightPlugTypeCosmetic {
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

export declare const enum DeepsightPlugTypeMasterwork {
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

export declare const enum DeepsightPlugTypeVendor {
	None,
	HolidayOven,
}

export declare const enum DeepsightPlugTypeExtractable {
	None,
	DeepsightResonance,
	DeepsightActivation,
}

export declare type DeepsightPlugTypeMap = {
	[DeepsightPlugCategory.None]: null,
	[DeepsightPlugCategory.Classified]: null,
	[DeepsightPlugCategory.Unknown]: null,
	[DeepsightPlugCategory.Intrinsic]: typeof DeepsightPlugTypeIntrinsic,
	[DeepsightPlugCategory.Perk]: typeof DeepsightPlugTypePerk,
	[DeepsightPlugCategory.Mod]: typeof DeepsightPlugTypeMod,
	[DeepsightPlugCategory.Subclass]: typeof DeepsightPlugTypeSubclass,
	[DeepsightPlugCategory.Cosmetic]: typeof DeepsightPlugTypeCosmetic,
	[DeepsightPlugCategory.Masterwork]: typeof DeepsightPlugTypeMasterwork,
	[DeepsightPlugCategory.Artifact]: null,
	[DeepsightPlugCategory.Vendor]: typeof DeepsightPlugTypeVendor,
	[DeepsightPlugCategory.StatusEffect]: null,
	[DeepsightPlugCategory.Infusion]: null,
	[DeepsightPlugCategory.Extractable]: typeof DeepsightPlugTypeExtractable,
};

export declare type DeepsightPlugType<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> =
	DeepsightPlugCategory extends CATEGORY ? ({ [CATEGORY in DeepsightPlugCategory]: DeepsightPlugType<CATEGORY> } extends infer ALL_CATEGORIES ? ALL_CATEGORIES[keyof ALL_CATEGORIES] : never)
	: (DeepsightPlugTypeMap)[CATEGORY] extends infer TYPE_ENUM ? TYPE_ENUM[keyof TYPE_ENUM] : never;

export declare interface DeepsightPlugCategorisationGeneric<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> {
	hash: number;
	category: CATEGORY;
	categoryName: string;
	type?: DeepsightPlugType<CATEGORY>;
	typeName?: string;
	fullName: DeepsightPlugFullName<CATEGORY>;
}

export declare interface DeepsightPlugCategorisationMasterwork extends DeepsightPlugCategorisationGeneric<DeepsightPlugCategory.Masterwork> {
	complete?: boolean;
	stat?: StatHashes;
	value?: number;
}

export declare interface DeepsightPlugCategorisationMod extends DeepsightPlugCategorisationGeneric<DeepsightPlugCategory.Mod> {
	adept?: boolean;
	bucketHash?: InventoryBucketHashes;
	raid?: boolean;
	artifice?: boolean;
	activityHash?: ActivityHashes;
}

export declare interface DeepsightPlugCategorisationSubclass extends DeepsightPlugCategorisationGeneric<DeepsightPlugCategory.Subclass> {
	damageType?: DamageTypeHashes;
	subclasses?: InventoryItemHashes[];
}

interface DeepsightPlugCategorisationMap {
	[DeepsightPlugCategory.Masterwork]: DeepsightPlugCategorisationMasterwork;
	[DeepsightPlugCategory.Mod]: DeepsightPlugCategorisationMod;
	[DeepsightPlugCategory.Subclass]: DeepsightPlugCategorisationSubclass;
}

export declare type DeepsightPlugCategorisation<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> =
	DeepsightPlugCategory extends CATEGORY ? ({ [CATEGORY in DeepsightPlugCategory]: DeepsightPlugCategorisation<CATEGORY> } extends infer ALL_CATEGORIES ? ALL_CATEGORIES[keyof ALL_CATEGORIES] : never)
	: DeepsightPlugCategorisationMap extends { [KEY in CATEGORY]: infer CATEGORISATION } ? CATEGORISATION : DeepsightPlugCategorisationGeneric<CATEGORY>;

type ReverseCategoryMap = { [KEY in keyof typeof DeepsightPlugCategory as (typeof DeepsightPlugCategory)[KEY] extends infer ORDINAL extends number ? ORDINAL : never]: KEY }

export declare type DeepsightPlugCategoryName = ReverseCategoryMap[keyof ReverseCategoryMap];

export declare type DeepsightPlugFullName<CATEGORY extends DeepsightPlugCategory = DeepsightPlugCategory> =
	DeepsightPlugCategory extends CATEGORY ? ({ [CATEGORY in DeepsightPlugCategory]: DeepsightPlugFullName<CATEGORY> } extends infer ALL_CATEGORIES ? ALL_CATEGORIES[keyof ALL_CATEGORIES] : never)
	: (DeepsightPlugTypeMap)[CATEGORY] extends infer TYPE_ENUM ? TYPE_ENUM extends null ? `${ReverseCategoryMap[CATEGORY]}`
	: `${ReverseCategoryMap[CATEGORY]}/${Extract<keyof TYPE_ENUM, string>}` : never;
