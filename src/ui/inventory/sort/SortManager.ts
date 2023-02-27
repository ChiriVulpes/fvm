import type Item from "model/models/items/Item";
import type { ISort } from "ui/inventory/sort/Sort";
import Sort from "ui/inventory/sort/Sort";
import SortAmmoType from "ui/inventory/sort/sorts/SortAmmoType";
import SortDamageType from "ui/inventory/sort/sorts/SortDamageType";
import SortDeepsight from "ui/inventory/sort/sorts/SortDeepsight";
import SortEnergy from "ui/inventory/sort/sorts/SortEnergy";
import SortMasterwork from "ui/inventory/sort/sorts/SortMasterwork";
import SortName from "ui/inventory/sort/sorts/SortName";
import SortPattern from "ui/inventory/sort/sorts/SortPattern";
import SortPower from "ui/inventory/sort/sorts/SortPower";
import SortRarity from "ui/inventory/sort/sorts/SortRarity";
import SortShaped from "ui/inventory/sort/sorts/SortShaped";
import SortSource from "ui/inventory/sort/sorts/SortSource";
import SortStatDistribution from "ui/inventory/sort/sorts/SortStatDistribution";
import SortStatTotal from "ui/inventory/sort/sorts/SortStatTotal";
import SortWeaponType from "ui/inventory/sort/sorts/SortWeaponType";
import Store from "utility/Store";

const sortMap: Record<Sort, ISort> = {
	[Sort.Name]: SortName,
	[Sort.Power]: SortPower,
	[Sort.Energy]: SortEnergy,
	[Sort.Deepsight]: SortDeepsight,
	[Sort.Pattern]: SortPattern,
	[Sort.Masterwork]: SortMasterwork,
	[Sort.Rarity]: SortRarity,
	[Sort.StatTotal]: SortStatTotal,
	[Sort.StatDistribution]: SortStatDistribution,
	[Sort.Source]: SortSource,
	[Sort.Shaped]: SortShaped,
	[Sort.AmmoType]: SortAmmoType,
	[Sort.DamageType]: SortDamageType,
	[Sort.WeaponType]: SortWeaponType,
};

for (const [type, sort] of Object.entries(sortMap))
	if (+type !== sort.id)
		throw new Error(`Sort ${Sort[+type as Sort]} implementation miscategorised`);

export interface ISortManagerConfiguration {
	id: string;
	name: string;
	readonly default: readonly Sort[];
	readonly inapplicable: readonly Sort[];
}

interface SortManager extends ISortManagerConfiguration { }
class SortManager {

	private current!: ISort[];
	public constructor (configuration: ISortManagerConfiguration) {
		this.initialise(configuration);
	}

	public initialise (configuration: ISortManagerConfiguration) {
		Object.assign(this, configuration);

		let sort: readonly Sort[] = (Store.get(`sort-${this.id}`) as (keyof typeof Sort)[] ?? [])
			.map(sortName => Sort[sortName])
			.filter(sort => !isNaN(+sort));

		if (!sort.length)
			sort = this.default;

		this.current = sort.map(sortType => sortMap[sortType]);
	}

	public get () {
		return this.current;
	}

	public getDisabled () {
		return Object.values(sortMap)
			.filter(sort => !this.current.includes(sort) && !this.inapplicable.includes(sort.id))
			.sort((a, b) => a.id - b.id);
	}

	public set (sort: ISort[]) {
		this.current.splice(0, Infinity, ...sort);
		Store.set(`sort-${this.id}`, this.current.map(sort => Sort[sort.id]));
	}

	public sort (items: readonly Item[]) {
		return items.slice().sort((itemA, itemB) => {
			for (const sort of this.current) {
				const result = sort.sort(itemA, itemB);
				if (result !== 0)
					return result;
			}

			const hasInstanceDifference = Number(!!itemB.reference.itemInstanceId) - Number(!!itemA.reference.itemInstanceId);
			if (hasInstanceDifference)
				// sort things with an instance id before things without an instance id
				return hasInstanceDifference;

			return (itemA.reference.itemInstanceId ?? `${itemA.reference.itemHash}`)?.localeCompare(itemB.reference.itemInstanceId ?? `${itemB.reference.itemHash}`);
		});
	}
}

export default SortManager;
