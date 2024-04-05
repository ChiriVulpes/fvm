import type { UserInfoCard } from "bungie-api-ts/user";
import type { IModelGenerationApi } from "model/Model";
import Model from "model/Model";
import Bungie from "utility/endpoint/bungie/Bungie";
import GetMembershipsForCurrentUser from "utility/endpoint/bungie/endpoint/user/GetMembershipsForCurrentUser";
import Store from "utility/Store";

const Memberships = Model.create("memberships", {
	cache: "Session",
	resetTime: "Daily",
	generate: () => GetMembershipsForCurrentUser.query(),
});

export default Memberships;

export async function getCurrentDestinyMembership (api?: IModelGenerationApi, amount?: number, from?: number) {
	if (!Bungie.authenticated)
		return undefined;

	const memberships = await (api?.subscribeProgressAndWait(Memberships, amount ?? 1) ?? Memberships.await());
	if (Store.items.destinyMembershipType === undefined)
		return getPrimaryDestinyMembership(memberships.destinyMemberships);

	return memberships.destinyMemberships.find(membership => membership.membershipType === Store.items.destinyMembershipType)
		?? memberships.destinyMemberships[0];
}

export function getPrimaryDestinyMembership<CARD extends UserInfoCard = UserInfoCard> (memberships: CARD[]): CARD {
	const firstMembership = memberships[0];
	if (!firstMembership?.crossSaveOverride)
		return firstMembership;

	return memberships.find(membership => membership.membershipType === firstMembership.crossSaveOverride)
		?? firstMembership;
}
