import { ItemCategoryHashes } from "bungie-api-ts/destiny2";
import Sort from "ui/inventory/sort/Sort";
import SortManager from "ui/inventory/sort/SortManager";
import InventoryArmourView, { SORTS_DEFAULT_ARMOUR, SORTS_INAPPLICABLE_ARMOUR } from "ui/view/inventory/InventoryArmourView";

export default InventoryArmourView.create({
	id: "class-item",
	name: "Class Item",
	slot: ItemCategoryHashes.ClassItems,
	sort: new SortManager({
		id: "class-items",
		name: "Class Items",
		default: SORTS_DEFAULT_ARMOUR,
		inapplicable: [...SORTS_INAPPLICABLE_ARMOUR, Sort.StatDistribution, Sort.StatTotal],
	}),
});
