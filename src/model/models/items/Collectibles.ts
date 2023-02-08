import type { DestinyCollectiblesComponent, DestinyProfileCollectiblesComponent, DictionaryComponentResponse, SingleComponentResponse } from "bungie-api-ts/destiny2";
import type { IItemInit } from "model/models/items/Item";

namespace Collectibles {

	export interface ICollectiblesProfile {
		profileCollectibles?: SingleComponentResponse<DestinyProfileCollectiblesComponent>;
		characterCollectibles?: DictionaryComponentResponse<DestinyCollectiblesComponent>;
	}

	export function apply (profile: ICollectiblesProfile, item: IItemInit) {
		const collectible = profile.profileCollectibles?.data?.collectibles[item.definition.collectibleHash!]
			?? Object.values(profile.characterCollectibles?.data ?? {})[0].collectibles[item.definition.collectibleHash!];
		item.collectibleState = collectible?.state;
	}
}

export default Collectibles;
