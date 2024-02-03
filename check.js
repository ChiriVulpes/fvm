/* eslint-disable @typescript-eslint/no-var-requires, no-undef, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const fs = require("fs/promises");

const ENDPOINT_PGCR = "https://stats.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport";

const apiKey = process.env.DEEPSIGHT_MANIFEST_API_KEY;
if (!apiKey)
	throw new Error("No API key set");

async function getDestinyManifestVersion () {
	return apiRequest("Manifest/").then(response => response?.version);
}

async function hasProfileCharacter () {
	return apiRequest("3/Profile/4611686018494087946/Character/2305843009532315461/?components=200").then(response => !!response?.character?.data);
}

/**
 * @param {string} endpoint
 */
async function apiRequest (endpoint) {
	let response;
	const maxAttempts = 1;
	for (let attempts = 0; !response && attempts < maxAttempts; attempts++) {
		const abortController = new AbortController();
		setTimeout(() => abortController.abort(), 20000); // 20 seconds max for a request
		response = await fetch(`https://www.bungie.net/Platform/Destiny2/${endpoint}`, {
			signal: abortController.signal,
			headers: {
				"X-API-Key": /** @type {string} */(apiKey),
			},
		})
			.then(response => response.status === 200 ? response.json()
				: { type: "error", code: response.status, message: response.statusText })
			.catch(err => ({ type: "error", message: err.message }))
			.then(json => {
				const response = json.Response;
				if (!response)
					console.warn(`/${endpoint} did not return a valid response: ${JSON.stringify(json)}`);
				return json.Response;
			});

		if (!response)
			await sleep(1000);
	}

	return response;
}

class PGCR {

	/**
	 * @typedef {`${bigint}-${bigint}-${bigint}T${bigint}:${bigint}:${bigint}Z`} Iso
	 */

	/**
	 * @typedef PGCRActivityDetails
	 * @property {`${bigint}`} instanceId
	 */

	/**
	 * @typedef PGCRResponse
	 * @property {Iso} period
	 * @property {PGCRActivityDetails} activityDetails
	 */

	/**
	 * Binary searches over the PGCRs looking for any PGCR more recent than the target time.
	 * @param {number} targetTime The time that the returned PGCR must be newer than
	 * @param {number} searchStart The PGCR ID that the search should use as its start
	 * @param {number} searchEnd The PGCR ID that the search should use as its end
	 * @returns {Promise<PGCRResponse | undefined>} A PGCR ID newer than the target time
	 */
	static async getNewerThan (targetTime, searchStart = 14008975359, searchEnd = 137438953470) {
		let attempts = 0;
		let lastMid = 0;
		while (true) {
			attempts++;
			const mid = Math.floor((searchStart + searchEnd) / 2);
			if (mid === lastMid) {
				console.log("[PGCR Search] Failed to find a recent PGCR, range was invalid.");
				return undefined;
			}

			lastMid = mid;

			console.log("[PGCR Search] Query:", mid, "Current range:", searchStart, searchEnd, "Query count:", attempts);
			const response = await this.getPGCR(mid).then(response => response.json());

			if (response?.Response?.period) {
				if (new Date(response.Response.period).getTime() > targetTime)
					return response.Response;

				searchStart = mid + 1;
			} else {
				searchEnd = mid - 1;
			}

			if (attempts >= 100) {
				console.log("[PGCR Search] Failed to find a recent PGCR, too many attempts.");
				return undefined;
			}

			await sleep(100);
		}
	}

	/**
	 * @param {number} id
	 */
	static async getPGCR (id) {
		return fetch(`${ENDPOINT_PGCR}/${id}/`, {
			headers: {
				"X-API-Key": /** @type {string} */(apiKey),
			},
		});
	}
}

/**
 * @param {number} time
 */
async function sleep (time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

class Time {
	static get lastDailyReset () {
		return this.nextDailyReset - this.days(1);
	}

	static get lastWeeklyReset () {
		return this.nextWeeklyReset - this.days(7);
	}

	static get lastTrialsReset () {
		return this.nextWeeklyReset - this.days(4);
	}

	static get nextDailyReset () {
		const time = new Date().setUTCHours(17, 0, 0, 0);
		return time < Date.now() ? time + this.days(1) : time;
	}

	static get nextWeeklyReset () {
		const now = Date.now();
		const week = now + (this.days(7) - (now % this.days(7))) - this.days(1) - this.hours(7);
		return week < Date.now() ? week + this.days(7) : week;
	}

	/**
	 * @param {number} days
	 */
	static days (days) {
		return days * 1000 * 60 * 60 * 24;
	}

	/**
	 * @param {number} hours
	 */
	static hours (hours) {
		return hours * 1000 * 60 * 60;
	}

	/**
	 * @param {number} minutes
	 */
	static minutes (minutes) {
		return minutes * 1000 * 60;
	}

	/**
	 * @param {number} seconds
	 */
	static seconds (seconds) {
		return seconds * 1000;
	}

	/**
	 * @param {number | "days" | "minutes" | "seconds"} interval
	 * @param {number} end
	 * @param {number} start
	 */
	static elapsed (interval, start, end) {
		if (typeof interval === "string") interval = this[interval](1);
		return (end - start) / interval;
	}
}


////////////////////////////////////
// Check time!

const ESTIMATED_PGCRS_PER_SECOND = 69; // technically it's closer to 70 but this is nicer
const REFERENCE_PGCR_RETRIEVAL_DELAY = Time.minutes(30);

void (async () => {
	let versions;
	let savedVersion;
	let savedLastDailyReset = 0;
	try {
		const versionsString = await fs.readFile("versions.json", "utf8");
		versions = JSON.parse(versionsString) ?? {};
		savedVersion = versions["Destiny2/Manifest"];
		savedLastDailyReset = new Date(versions.lastDailyReset ?? savedLastDailyReset).getTime();
	} catch {
		console.warn("No saved versions, triggering rebuild");
		return;
	}

	let needsUpdate = false;

	const bungieVersion = await getDestinyManifestVersion();
	if (!bungieVersion)
		// always skip manifest update if manifest is unavailable
		throw new Error("Unable to get current manifest version, API may be disabled or unavailable");

	const hasCharacter = await hasProfileCharacter();
	if (!hasCharacter)
		throw new Error("Skipping this build, API may be disabled or unavailable");

	const lastDailyReset = Time.lastDailyReset;
	const lastWeeklyReset = Time.lastWeeklyReset;
	const lastTrialsReset = Time.lastTrialsReset;

	if (lastDailyReset !== savedLastDailyReset && Date.now() - lastDailyReset > REFERENCE_PGCR_RETRIEVAL_DELAY) {
		console.log("New reference PGCR required");
		let searchStart;
		let searchEnd;

		const lastRefPGCR = versions.referencePostGameCarnageReportSinceDailyReset;
		if (lastRefPGCR) {
			const refId = +lastRefPGCR.instanceId;
			const refTime = new Date(lastRefPGCR.period).getTime();
			searchStart = refId + ESTIMATED_PGCRS_PER_SECOND * Time.elapsed("seconds", refTime, lastDailyReset) - ESTIMATED_PGCRS_PER_SECOND * (Time.days(1) / Time.seconds(1));
			searchEnd = refId + ESTIMATED_PGCRS_PER_SECOND * Time.elapsed("seconds", refTime, Date.now()) * 20;
		}

		const recentPGCR = await PGCR.getNewerThan(lastDailyReset + Time.minutes(20), searchStart, searchEnd);
		if (recentPGCR) {
			needsUpdate = true;
			versions.deepsight++;
			console.log(`Updated to v${versions.deepsight}`);
			versions.updated = new Date().toISOString().slice(0, -5) + "Z";
			versions.lastDailyReset = new Date(lastDailyReset).toISOString().slice(0, -5) + "Z";
			versions.lastWeeklyReset = new Date(lastWeeklyReset).toISOString().slice(0, -5) + "Z";
			versions.lastTrialsReset = new Date(lastTrialsReset).toISOString().slice(0, -5) + "Z";
			versions.referencePostGameCarnageReportSinceDailyReset = {
				instanceId: recentPGCR.activityDetails.instanceId,
				period: recentPGCR.period,
			};
			await fs.writeFile("versions.json", JSON.stringify(versions, null, "\t") + "\n");

			if (!process.env.DEEPSIGHT_MANIFEST_NO_INCREMENT_VERSION) {
				const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
				const packageJsonVersionMinor = packageJson.version.slice(0, packageJson.version.lastIndexOf("."));
				packageJson.version = `${packageJsonVersionMinor}.${versions.deepsight}`;
				await fs.writeFile("package.json", JSON.stringify(packageJson, null, "\t"));
			}
		}
	}

	if (savedVersion !== bungieVersion) {
		needsUpdate = true;
		console.log("New Destiny 2 manifest! Saved version:", savedVersion, "New version:", bungieVersion);
		return;
	}

	if (!needsUpdate)
		throw new Error("No update necessary");
})();
