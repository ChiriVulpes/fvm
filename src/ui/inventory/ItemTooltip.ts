import { DestinyAmmunitionType } from "bungie-api-ts/destiny2";
import type { Item } from "model/models/Items";
import Manifest from "model/models/Manifest";
import { Classes } from "ui/Classes";
import Component from "ui/Component";
import TooltipManager, { Tooltip } from "ui/TooltipManager";

enum ItemTooltipClasses {
	Main = "item-tooltip",
	Content = "item-tooltip-content",
	SourceWatermark = "item-tooltip-source-watermark",
	Masterwork = "item-tooltip-masterwork",
	PrimaryInfo = "item-tooltip-primary-info",
	PrimaryStat = "item-tooltip-primary-stat",
	PrimaryStatDamage = "item-tooltip-primary-stat-damage",
	AmmoType = "item-tooltip-ammo-type",
	AmmoPrimary = "item-tooltip-ammo-type-primary",
	AmmoSpecial = "item-tooltip-ammo-type-special",
	AmmoHeavy = "item-tooltip-ammo-type-heavy",
	Energy = "item-tooltip-energy",
	EnergyValue = "item-tooltip-energy-value",
	Deepsight = "item-tooltip-deepsight",
	DeepsightPattern = "item-tooltip-deepsight-pattern",
	DeepsightPatternNumber = "item-tooltip-deepsight-pattern-number",
	DeepsightPatternOutOf = "item-tooltip-deepsight-pattern-out-of",
	DeepsightPatternRequired = "item-tooltip-deepsight-pattern-required",
	DeepsightProgressBar = "item-tooltip-deepsight-progress-bar",
	DeepsightProgressValue = "item-tooltip-deepsight-progress-value",
}

class ItemTooltip extends Tooltip {

	public source!: Component;
	public primaryInfo!: Component;
	public primaryStat!: Component;
	public ammoType!: Component;
	public energy!: Component;
	public energyValue!: Component;
	public deepsight!: Component;
	public deepsightPattern!: Component;
	public deepsightPatternNumber!: Component;
	public deepsightPatternRequired!: Component;
	public deepsightProgressBar!: Component;
	public deepsightProgressValue!: Component;

	protected override onMake () {
		this.classes.add(ItemTooltipClasses.Main);
		this.content.classes.add(ItemTooltipClasses.Content);

		this.source = Component.create()
			.classes.add(ItemTooltipClasses.SourceWatermark, Classes.Hidden)
			.appendTo(this.header);

		this.primaryInfo = Component.create()
			.classes.add(ItemTooltipClasses.PrimaryInfo)
			.appendTo(this.content);

		this.primaryStat = Component.create()
			.classes.add(ItemTooltipClasses.PrimaryStat)
			.appendTo(this.primaryInfo);

		this.ammoType = Component.create()
			.classes.add(ItemTooltipClasses.AmmoType)
			.appendTo(this.primaryInfo);

		this.energy = Component.create()
			.classes.add(ItemTooltipClasses.Energy)
			.appendTo(this.primaryInfo);

		this.energyValue = Component.create()
			.classes.add(ItemTooltipClasses.EnergyValue)
			.appendTo(this.energy);

		this.energy.text.add("Energy");

		this.deepsight = Component.create()
			.classes.add(ItemTooltipClasses.Deepsight)
			.appendTo(this.content);

		this.deepsightPattern = Component.create()
			.classes.add(ItemTooltipClasses.DeepsightPattern)
			.text.add("Attune to extract pattern")
			.append(this.deepsightPatternNumber = Component.create()
				.classes.add(ItemTooltipClasses.DeepsightPatternNumber))
			.append(Component.create()
				.classes.add(ItemTooltipClasses.DeepsightPatternOutOf)
				.text.add(" / ")
				.append(this.deepsightPatternRequired = Component.create()
					.classes.add(ItemTooltipClasses.DeepsightPatternRequired)))
			.appendTo(this.deepsight);

		this.deepsightProgressBar = Component.create()
			.classes.add(ItemTooltipClasses.DeepsightProgressBar)
			.text.add("Attunement Progress")
			.appendTo(this.deepsight);

		this.deepsightProgressValue = Component.create()
			.classes.add(ItemTooltipClasses.DeepsightProgressValue)
			.appendTo(this.deepsightProgressBar);
	}

	public async setItem (item: Item) {
		console.log(item.definition.displayProperties.name, item);

		const { DestinyItemTierTypeDefinition, DestinyDamageTypeDefinition, DestinyEnergyTypeDefinition } = await Manifest.await();
		const tier = await DestinyItemTierTypeDefinition.get(item.definition.inventory?.tierTypeHash);
		this.classes.removeWhere(cls => cls.startsWith("item-tooltip-tier-"))
			.classes.add(`item-tooltip-tier-${(tier?.displayProperties.name ?? "Common")?.toLowerCase()}`)
			.classes.toggle(item.isMasterwork(), ItemTooltipClasses.Masterwork);

		this.title.text.set(item.definition.displayProperties.name);
		this.subtitle.removeContents();

		this.subtitle.text.set(item.definition.itemTypeDisplayName);
		this.extra.text.set(item.definition.inventory?.tierTypeName);

		this.source.classes.toggle(!item.source?.displayProperties.icon, Classes.Hidden);
		if (item.source?.displayProperties.icon)
			this.source.style.set("--icon", `url("${item.source.displayProperties.icon}")`);

		const damageType = await DestinyDamageTypeDefinition.get(item.instance?.damageTypeHash);

		const primaryStat = item.instance?.primaryStat.value;
		this.primaryStat
			.classes.toggle(primaryStat === undefined, Classes.Hidden)
			.classes.removeWhere(cls => cls.startsWith("item-tooltip-energy-type-"))
			.text.set(`${primaryStat ?? ""}`)
			.style.remove("--icon")
			.classes.toggle(damageType !== undefined, ItemTooltipClasses.PrimaryStatDamage);

		if (damageType !== undefined)
			this.primaryStat
				.classes.add(`item-tooltip-energy-type-${(damageType?.displayProperties.name ?? "Unknown").toLowerCase()}`)
				.style.set("--icon", `url("https://www.bungie.net${damageType?.displayProperties.icon ?? ""}")`);

		const ammoType = item.definition.equippingBlock?.ammoType;
		this.ammoType.classes.toggle(!ammoType, Classes.Hidden);
		if (ammoType)
			this.ammoType.classes.remove(ItemTooltipClasses.AmmoPrimary, ItemTooltipClasses.AmmoSpecial, ItemTooltipClasses.AmmoHeavy)
				.classes.add(ammoType === DestinyAmmunitionType.Primary ? ItemTooltipClasses.AmmoPrimary
					: ammoType === DestinyAmmunitionType.Special ? ItemTooltipClasses.AmmoSpecial
						: ammoType === DestinyAmmunitionType.Heavy ? ItemTooltipClasses.AmmoHeavy
							: ItemTooltipClasses.AmmoType)
				.text.set(ammoType === DestinyAmmunitionType.Primary ? "Primary"
					: ammoType === DestinyAmmunitionType.Special ? "Special"
						: ammoType === DestinyAmmunitionType.Heavy ? "Heavy"
							: "");

		const energy = item.instance?.energy;
		this.energy.classes.toggle(energy === undefined, Classes.Hidden);
		if (energy !== undefined) {
			const energyType = await DestinyEnergyTypeDefinition.get(energy.energyTypeHash);
			this.energyValue.text.set(`${energy.energyCapacity}`)
				.classes.removeWhere(cls => cls.startsWith("item-tooltip-energy-type-"))
				.classes.add(`item-tooltip-energy-type-${(energyType?.displayProperties.name ?? "Unknown").toLowerCase()}`)
				.style.set("--icon", `url("https://www.bungie.net${energyType?.displayProperties.icon ?? ""}")`);
		}

		this.deepsight.classes.toggle(!item.deepsight, Classes.Hidden);
		if (item.deepsight) {
			const progress = (item.deepsight.attunement.progress ?? 0) / item.deepsight.attunement.completionValue;
			this.deepsightProgressBar.style.set("--progress", `${progress}`);
			this.deepsightProgressValue.text.set(`${Math.floor(progress * 100)}%`);

			const showPattern = item.deepsight.pattern && !item.deepsight.pattern.progress.complete;
			this.deepsightPattern.classes.toggle(!showPattern, Classes.Hidden);
			if (showPattern) {
				this.deepsightPatternNumber.text.set(`${(item.deepsight.pattern!.progress.progress ?? 0) + 1}`);
				this.deepsightPatternRequired.text.set(`${item.deepsight.pattern!.progress.completionValue}`);
			}
		}
	}
}

export default TooltipManager.create(tooltip => tooltip
	.make(ItemTooltip));
