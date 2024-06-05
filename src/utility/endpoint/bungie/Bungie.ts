import { DestinyComponentType } from "bungie-api-ts/destiny2";
import Memberships from "model/models/Memberships";
import BungieID from "utility/BungieID";
import BungieEndpoint from "utility/endpoint/bungie/BungieEndpoint";
import GetProfile from "utility/endpoint/bungie/endpoint/destiny2/GetProfile";
import GetUserClan from "utility/endpoint/bungie/endpoint/groupv2/GetUserClan";
import RequestOAuthToken from "utility/endpoint/bungie/endpoint/RequestOAuthToken";
import Env from "utility/Env";
import { EventManager } from "utility/EventManager";
import Store from "utility/Store";
import Time from "utility/Time";
import URL from "utility/URL";

export interface IBungieApiEvents {
	authenticated: { authType: "new" | "refresh" };
	resetAuthentication: Event;
	error: BungieEndpoint.IEvents["error"];
	apiDown: BungieEndpoint.IEvents["apiDown"];
	querySuccess: BungieEndpoint.IEvents["querySuccess"];
}

export class BungieAPI {

	public get lastDailyReset () {
		return this.nextDailyReset - Time.days(1);
	}

	public get lastWeeklyReset () {
		return this.nextWeeklyReset - Time.weeks(1);
	}

	public get lastTrialsReset () {
		return this.nextWeeklyReset - Time.days(4);
	}

	public get nextDailyReset () {
		const time = new Date().setUTCHours(17, 0, 0, 0);
		return time < Date.now() ? time + Time.days(1) : time;
	}

	public get nextWeeklyReset () {
		const now = Date.now();
		const week = now + (Time.weeks(1) - (now % Time.weeks(1))) - Time.days(1) - Time.hours(7);
		return week < Date.now() ? week + Time.weeks(1) : week;
	}

	public event = new EventManager<this, IBungieApiEvents>(this)
		.pipe("error", BungieEndpoint.event)
		.pipe("apiDown", BungieEndpoint.event)
		.pipe("querySuccess", BungieEndpoint.event);

	public apiDown = false;

	public constructor () {
		BungieEndpoint.event.subscribe("authenticationFailed", () =>
			this.resetAuthentication());
		BungieEndpoint.event.subscribe("validateAuthorisation", ({ setAuthorisationPromise, force }) =>
			setAuthorisationPromise(this.validateAuthorisation(force)));
		BungieEndpoint.event.subscribe("apiDown", () => this.apiDown = true);
		BungieEndpoint.event.subscribe("querySuccess", () => this.apiDown = false);

		Object.assign(window, { Bungie: this });
	}

	public get authenticated () {
		const profile = Store.getProfile()?.data;
		return !!(profile?.authCode && profile.accessToken);
	}

	public async authenticate (type: "start" | "complete"): Promise<boolean> {
		let profile = Store.items.profiles?.[""];
		if (!profile)
			type = "start";

		if (type === "start") {
			const profiles = Store.items.profiles ?? {};
			profile = profiles[""] = { lastModified: new Date().toISOString() };
			Store.items.profiles = profiles;
		}

		if (!profile!.authCode && !URL.params.code) {
			if (type !== "start") {
				// the user didn't approve of starting auth yet
				return false;
			}

			// step 1: get an auth code for this user

			const clientId = Env.DEEPSIGHT_BUNGIE_CLIENT_ID;
			if (!clientId)
				throw new Error("Cannot authenticate with Bungie, no client ID in environment");

			location.href = `https://www.bungie.net/en/oauth/authorize?client_id=${clientId}&response_type=code`; // &state=${state}`;
			return false;
		}

		if (!profile!.authCode) {
			// step 2: receive auth code from bungie oauth

			// received auth code
			const profiles = Store.items.profiles ?? {};
			profile = profiles[""] = {
				...profiles[""],
				authCode: URL.params.code!,
				lastModified: new Date().toISOString(),
			};
			Store.items.profiles = profiles;
		}

		delete URL.params.code;
		// delete URL.params.state;

		if (!profile!.accessToken) {
			// step 3: get an access token
			return await this.requestToken("new");
		}

		return false;
	}

	public resetAuthentication () {
		delete URL.params.code;
		delete URL.params.state;

		const profiles = Store.items.profiles ?? {};
		const profile = profiles[""];
		if (profile) {
			delete profile.authCode;
			delete profile.accessToken;
			delete profile.accessTokenExpireTime;
			delete profile.accessTokenMembershipId;
			delete profile.accessTokenRefreshExpireTime;
			delete profile.accessTokenRefreshToken;
			profile.lastModified = new Date().toISOString();
			Store.items.profiles = profiles;
		}

		this.event.emit("resetAuthentication");
	}

	private async validateAuthorisation (force = false) {
		if (!force && (Store.getProfile()?.data?.accessTokenExpireTime ?? 0) > Date.now())
			return; // authorisation valid

		await this.requestToken("refresh");
	}

	private async requestToken (type: "new" | "refresh") {
		const profiles = Store.items.profiles ?? {};
		const storeProfile = profiles[""];
		if (!storeProfile)
			// no profile to request token for
			return false;

		if (type === "refresh" && !storeProfile.accessTokenRefreshToken)
			return false;

		if (type === "new" && !storeProfile.authCode)
			return false;

		const result = await RequestOAuthToken.query(storeProfile);

		if ("error" in result) {
			if (result.error === "invalid_grant") {
				this.resetAuthentication();
				throw Object.assign(new Error(result.error_description as string | undefined ?? "Invalid grant"), result);
			}

			return false;
		}

		storeProfile.accessToken = result.access_token;
		storeProfile.accessTokenExpireTime = Date.now() + result.expires_in * 1000;
		storeProfile.accessTokenMembershipId = result.membership_id;
		storeProfile.accessTokenRefreshExpireTime = Date.now() + result.refresh_expires_in * 1000;
		storeProfile.accessTokenRefreshToken = result.refresh_token;
		storeProfile.lastModified = new Date().toISOString();

		const membership = await Memberships.getCurrentDestinyMembership(storeProfile);
		if (!membership) {
			delete profiles[""];
			Store.items.profiles = profiles;
			return false;
		}

		const bungieId: BungieID = { name: membership.bungieGlobalDisplayName, code: membership.bungieGlobalDisplayNameCode ?? 0 };
		storeProfile.membershipType = membership.membershipType;
		storeProfile.membershipId = membership.membershipId;

		const profile = await GetProfile
			.setOptionalAuth(true)
			.query(membership.membershipType, membership.membershipId, [DestinyComponentType.Profiles, DestinyComponentType.Characters]);

		const currentCharacter = Object.values(profile.characters.data ?? {})
			?.sort(({ dateLastPlayed: dateLastPlayedA }, { dateLastPlayed: dateLastPlayedB }) =>
				new Date(dateLastPlayedB).getTime() - new Date(dateLastPlayedA).getTime())
			?.[0];

		const clan = await GetUserClan.query(membership.membershipType, membership.membershipId);

		storeProfile.emblemHash = currentCharacter?.emblemHash;
		storeProfile.class = currentCharacter?.classType;
		storeProfile.callsign = clan?.results?.[0]?.group?.clanInfo?.clanCallsign ?? "";
		storeProfile.callsignLastModified = new Date().toISOString();

		const idString = BungieID.stringify(bungieId);
		delete profiles[""];
		profiles[idString] = storeProfile;
		Store.items.profiles = profiles;
		Store.items.selectedProfile = idString;
		location.reload();

		this.event.emit("authenticated", { authType: type });
		return true;
	}
}

export default new BungieAPI;
