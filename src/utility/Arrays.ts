import Define from "utility/Define";

declare global {
	interface Array<T> {
		/**
		 * Returns the value of the last element in the array where predicate is true, and undefined
		 * otherwise.
		 * @param predicate find calls predicate once for each element of the array, in ascending
		 * order, until it finds one where predicate returns true. If such an element is found, find
		 * immediately returns that element value. Otherwise, find returns undefined.
		 * @param thisArg If provided, it will be used as the this value for each invocation of
		 * predicate. If it is not provided, undefined is used instead.
		 */
		findLast<S extends T> (predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
		findLast (predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;

		/**
		 * Returns the index of the last element in the array where predicate is true, and -1
		 * otherwise.
		 * @param predicate find calls predicate once for each element of the array, in ascending
		 * order, until it finds one where predicate returns true. If such an element is found,
		 * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
		 * @param thisArg If provided, it will be used as the this value for each invocation of
		 * predicate. If it is not provided, undefined is used instead.
		 */
		findLastIndex (predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;
		/**
		 * Sorts an array in place.
		 * This method mutates the array and returns a reference to the same array.
		 * 
		 * @param sorters You may provide any number of sorter functions. 
		 * If no functions are provided, the elements are sorted in ascending, ASCII character order.
		 * 
		 * Each sorter function is used in sequence until a difference is found between a set of two items.
		 * 
		 * When a sorter function accepts 2 parameters, it is assumed to be a normal sorter function which will compare
		 * the given set of two items. It is expected to return a negative value if the first argument is less than 
		 * the second argument, zero if they're equal, and a positive value otherwise.
		 * ```ts
		 * [11,2,22,1].sort((a, b) => a - b)
		 * ```
		 * 
		 * When a sorter function accepts 1 parameter, it is assumed to be a "mapper" function.
		 * The mapper will be called for each of the two items to compare, and then the produced numbers of each will be compared.
		 */
		sort (...sorters: (((a: T, b: T) => number))[]): this;

		collect<RETURN, ARGS extends any[] = []> (collector: (array: T[], ...args: ARGS) => RETURN, ...args: ARGS): RETURN;
		collect<RETURN, ARGS extends any[] = []> (collector?: (array: T[], ...args: ARGS) => RETURN, ...args: ARGS): RETURN | undefined;

		splat<RETURN, ARGS extends any[] = []> (collector: (...args: [...T[], ...ARGS]) => RETURN, ...args: ARGS): RETURN;
		splat<RETURN, ARGS extends any[] = []> (collector?: (...args: [...T[], ...ARGS]) => RETURN, ...args: ARGS): RETURN | undefined;

		toObject (): T extends readonly [infer KEY extends string | number, infer VALUE, ...any[]] ? Record<KEY, VALUE> : never;
		toObject<MAPPER extends (value: T) => readonly [KEY, VALUE, ...any[]], KEY extends string | number, VALUE> (mapper: MAPPER): Record<KEY, VALUE>;
		toObject<MAPPER extends (value: T) => readonly [KEY, VALUE, ...any[]], KEY extends string | number, VALUE> (mapper?: MAPPER): Record<KEY, VALUE> | (T extends readonly [infer KEY extends string | number, infer VALUE, ...any[]] ? Record<KEY, VALUE> : never);

		distinct (): this;
		distinct (mapper: (value: T) => any): this;
	}
}

namespace Arrays {

	export type Or<T> = T | T[];

	export const EMPTY: [] = [];

	export function resolve<T = never> (or?: Or<T>): T[] {
		return Array.isArray(or) ? or : or === undefined ? [] : [or];
	}

	export function includes (array: Or<any>, value: any): boolean {
		return Array.isArray(array) ? array.includes(value) : array === value;
	}

	export function slice<T> (or: Or<T>): T[] {
		return Array.isArray(or) ? or.slice() : or === undefined ? [] : [or];
	}

	/**
	 * Removes one instance of the given value from the given array.
	 * @returns `true` if removed, `false` otherwise
	 */
	export function remove (array: any[] | undefined, ...values: any[]) {
		if (!array)
			return false;

		let removed = false;
		for (const value of values) {
			const index = array.indexOf(value);
			if (index === -1)
				continue;

			array.splice(index, 1);
			removed = true;
		}

		return removed;
	}

	/**
	 * Adds the given value to the given array if not present.
	 * @returns `true` if added, `false` otherwise
	 */
	export function add (array: any[] | undefined, value: any) {
		if (!array)
			return false;

		const index = array.indexOf(value);
		if (index !== -1)
			return false;

		array.push(value);
		return true;
	}

	export function tuple<VALUES extends any[]> (...values: VALUES): VALUES {
		return values;
	}

	export function range (end: number): number[];
	export function range (start: number, end?: number, step?: number): number[] {
		if (step === 0)
			throw new Error("Invalid step for range");

		const result: number[] = [];

		if (end === undefined)
			end = start, start = 0;

		step = end < start ? -1 : 1;

		for (let i = start; step > 0 ? i < end : i > end; i += step)
			result.push(i);

		return result;
	}

	export function filterNullish<VALUE> (value: VALUE): value is Exclude<VALUE, null | undefined> {
		return value !== null && value !== undefined;
	}

	export function filterFalsy<VALUE> (value: VALUE): value is Exclude<VALUE, null | undefined | 0 | ""> {
		return !!value;
	}

	export function applyPrototypes () {
		Define(Array.prototype, "findLast", function (predicate) {
			if (this.length > 0)
				for (let i = this.length - 1; i >= 0; i--)
					if (predicate(this[i], i, this))
						return this[i];

			return undefined;
		});

		Define(Array.prototype, "findLastIndex", function (predicate) {
			if (this.length > 0)
				for (let i = this.length - 1; i >= 0; i--)
					if (predicate(this[i], i, this))
						return i;

			return -1;
		});

		const originalSort = Array.prototype.sort;
		Define(Array.prototype, "sort", function (...sorters) {
			if (this.length <= 1)
				return this;

			if (!sorters.length)
				return originalSort.call(this);

			return originalSort.call(this, (a, b) => {
				for (const sorter of sorters) {
					if (sorter.length === 1) {
						const mapper = sorter as (item: any) => number;
						const sortValue = mapper(b) - mapper(a);
						if (sortValue) return sortValue;
					} else {
						const sortValue = sorter(a, b);
						if (sortValue) return sortValue;
					}
				}

				return 0;
			});
		});

		Define(Array.prototype, "collect", function (collector, ...args) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			return collector?.(this, ...args);
		});

		Define(Array.prototype, "splat", function (collector, ...args) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			return collector?.(...this, ...args);
		});

		Define(Array.prototype, "toObject", function (mapper) {
			return Object.fromEntries(mapper ? this.map(mapper) : this);
		});

		Define(Array.prototype, "distinct", function <T> (this: T[], mapper?: (value: T) => any) {
			const result: T[] = [];
			const encountered = mapper ? [] : result;

			for (const value of this) {
				const encounterValue = mapper ? mapper(value) : value;
				if (encountered.includes(encounterValue))
					continue;

				if (mapper)
					encountered.push(encounterValue);

				result.push(value);
			}

			return result;
		});
	}
}

export default Arrays;
