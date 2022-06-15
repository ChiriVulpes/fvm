import { ItemState } from "bungie-api-ts/destiny2";
import type { Item } from "model/models/Items";
import Manifest from "model/models/Manifest";
import Button from "ui/Button";
import Component from "ui/Component";
import ItemTooltip from "ui/inventory/ItemTooltip";

export enum ItemClasses {
	Main = "item",
	Icon = "item-icon",
	SourceWatermark = "item-source-watermark",
	SourceWatermarkCustom = "item-source-watermark-custom",
	Masterwork = "item-masterwork",
	MasterworkSpinny = "item-masterwork-spinny",
	Shaped = "item-shaped",
	Deepsight = "item-deepsight",
	DeepsightHasPattern = "item-deepsight-has-pattern",
	DeepsightPattern = "item-deepsight-pattern",
	DeepsightAttuned = "item-deepsight-attuned",
	Extra = "item-extra",
	PowerLevel = "item-power-level",
}

export default class ItemComponent extends Button<[Item]> {

	public item!: Item;

	protected override async onMake (item: Item) {
		super.onMake(item);

		this.item = item;

		this.classes.add(ItemClasses.Main);
		const { DestinyItemTierTypeDefinition, DestinyPowerCapDefinition } = await Manifest.await();
		const tier = await DestinyItemTierTypeDefinition.get(item.definition.inventory?.tierTypeHash);
		this.classes.add(`item-tier-${(tier?.displayProperties.name ?? "Common")?.toLowerCase()}`);

		Component.create()
			.classes.add(ItemClasses.Icon)
			.style.set("--icon", `url("https://www.bungie.net${item.definition.displayProperties.icon}")`)
			.appendTo(this);

		if (item.reference.state & ItemState.Crafted)
			Component.create()
				.classes.add(ItemClasses.Shaped)
				.append(Component.create())
				.appendTo(this);

		let watermark: string | undefined;
		const powerCap = await DestinyPowerCapDefinition.get(item.definition.quality?.versions[item.definition.quality.currentVersion].powerCapHash);
		if ((powerCap?.powerCap ?? 0) < 900000)
			watermark = item.definition.iconWatermarkShelved ?? item.definition.iconWatermark;
		else
			watermark = item.definition.iconWatermark ?? item.definition.iconWatermarkShelved;

		// Note: For some reason there's no watermarks on really old exotics.
		// DIM shows all of these ones with the red war icon.
		// TODO... figure out how, if necessary?

		if (watermark) {
			Component.create()
				.classes.add(ItemClasses.SourceWatermark)
				.style.set("--watermark", `url("https://www.bungie.net${watermark}")`)
				.appendTo(this);
		} else if (item.source?.displayProperties.icon) {
			Component.create()
				.classes.add(ItemClasses.SourceWatermark, ItemClasses.SourceWatermarkCustom)
				.style.set("--icon", `url("${item.source.displayProperties.icon}")`)
				.appendTo(this);
		}

		if (item.isMasterwork())
			Component.create()
				.classes.add(ItemClasses.Masterwork)
				.append(Component.create()
					.classes.add(ItemClasses.MasterworkSpinny))
				.appendTo(this);

		if (item.deepsight) {
			const container = Component.create()
				.classes.add(ItemClasses.Deepsight)
				.classes.toggle(item.deepsight.attunement?.complete ?? false, ItemClasses.DeepsightAttuned)
				.appendTo(this);

			if (item.deepsight.pattern && !item.deepsight.pattern.progress.complete)
				Component.create()
					.classes.add(ItemClasses.DeepsightPattern)
					.appendTo(container
						.classes.add(ItemClasses.DeepsightHasPattern));
		}

		// this.text.set(item.definition.displayProperties.name);
		this.setTooltip(ItemTooltip, tooltip => tooltip
			.setItem(item));

		const extra = Component.create()
			.classes.add(ItemClasses.Extra)
			.appendTo(this);

		if (item.instance?.primaryStat)
			Component.create()
				.classes.add(ItemClasses.PowerLevel)
				.text.set(`${item.instance.primaryStat.value}`)
				.appendTo(extra);
	}
}
