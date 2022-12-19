import { DestinyClass, ItemCategoryHashes, TierType } from "bungie-api-ts/destiny2";
import Model from "model/Model";
import Collections from "model/models/Collections";
import Inventory from "model/models/Inventory";
import type Item from "model/models/items/Item";
import Manifest from "model/models/Manifest";
import Sources from "model/models/Sources";
import Display from "ui/bungie/DisplayProperties";
import { InventoryClasses } from "ui/Classes";
import Component from "ui/Component";
import Details from "ui/Details";
import ItemComponent from "ui/inventory/Item";
import Loadable from "ui/Loadable";
import View from "ui/View";

export enum CollectionsViewClasses {
	Bucket = "view-collections-bucket",
	BucketDetails = "view-collections-bucket-details",
}

export default View.create({
	models: [Manifest, Sources, Inventory.createTemporary()] as const,
	id: "collections",
	name: "Collections",
	initialise: (view, manifest, sources, inventory) => {
		view.setTitle(title => title.text.set("Collections"));

		let shownExpansion = false;
		let shownSeason = false;
		for (const source of sources) {

			let defaultOpen = false;
			if (!shownExpansion && source.expansion) {
				defaultOpen = true;
				shownExpansion = true;
			}

			if (!shownSeason && source.season) {
				defaultOpen = true;
				shownSeason = true;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
			if ((+source.eventCard?.endTime! ?? 0) * 1000 > Date.now())
				defaultOpen = true;

			const details = Details.create()
				.classes.add(CollectionsViewClasses.BucketDetails)
				.toggle(defaultOpen)
				.tweak(details => details.summary.text.set(source.displayProperties.name))
				.appendTo(view.content);

			Loadable.create(Model.createTemporary(async () => {
				if (!defaultOpen)
					await details.event.waitFor("toggle");

				return Collections.source(source).await();
			}))
				.onReady(items => {
					console.log(source.displayProperties.name, items);
					return Component.create()
						.classes.add(CollectionsViewClasses.Bucket)
						.append(...items
							.sort((a, b) => getSortIndex(b) - getSortIndex(a)
								|| (Display.name(a.definition) ?? "").localeCompare(Display.name(b.definition) ?? ""))
							.map(item => Component.create()
								.classes.add(InventoryClasses.Slot)
								.append(ItemComponent.create([item, inventory]))));
				})
				.setSimple()
				.appendTo(details);
		}
	},
});

function getSortIndex (item: Item) {
	return (item.definition.itemCategoryHashes?.includes(ItemCategoryHashes.Weapon) ? 10000 : 0)
		+ (item.definition.inventory?.tierType ?? TierType.Unknown) * 1000
		+ (item.deepsight?.pattern ? item.deepsight.pattern.progress.complete ? 100 : 500 : 0)
		+ (item.definition.classType ?? DestinyClass.Unknown);
}
