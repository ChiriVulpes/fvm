/* eslint-disable @typescript-eslint/no-var-requires, no-undef, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const fs = require("fs/promises");

const ENDPOINT_PGCR = "https://stats.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport";

const apiKey = process.env.DEEPSIGHT_MANIFEST_API_KEY;
if (!apiKey)
	throw new Error("No API key set");

async function getDestinyManifestVersion () {
	let manifest;
	const maxAttempts = 1;
	for (let attempts = 0; !manifest && attempts < maxAttempts; attempts++) {
		const abortController = new AbortController();
		setTimeout(() => abortController.abort(), 20000); // 20 seconds max for a request
		manifest = await fetch("https://www.bungie.net/Platform/Destiny2/Manifest/", { signal: abortController.signal })
			.then(response => response.status === 200 ? response.json()
				: { type: "error", code: response.status, message: response.statusText })
			.catch(err => ({ type: "error", message: err.message }))
			.then(json => {
				const manifest = json.Response;
				if (!manifest)
					console.warn(`Bungie API did not return a valid manifest: ${JSON.stringify(json)}`);
				return json.Response;
			});

		if (!manifest)
			await sleep(1000);
	}

	return manifest?.version;
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
			console.log("[PGCR Search] Current range:", searchStart, searchEnd, "Query count:", attempts);

			const mid = Math.floor((searchStart + searchEnd) / 2);
			if (mid === lastMid) {
				console.log("[PGCR Search] Failed to find a recent PGCR, range was invalid.");
				return undefined;
			}

			lastMid = mid;

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
		savedLastDailyReset = versions.lastDailyReset ?? savedLastDailyReset;
	} catch {
		return;
	}

	let needsUpdate = false;

	const bungieVersion = await getDestinyManifestVersion();
	if (!bungieVersion)
		// always skip manifest update if manifest is unavailable
		throw new Error("Unable to get current manifest version, API may be disabled or unavailable");

	if (savedVersion !== bungieVersion) {
		needsUpdate = true;
		return;
	}

	const lastDailyReset = Time.lastDailyReset;
	const lastWeeklyReset = Time.lastWeeklyReset;
	const lastTrialsReset = Time.lastTrialsReset;

	if (lastDailyReset !== savedLastDailyReset && Date.now() - lastDailyReset > REFERENCE_PGCR_RETRIEVAL_DELAY) {
		let searchStart;
		let searchEnd;

		const lastRefPGCR = versions.referencePostGameCarnageReportSinceDailyReset;
		if (lastRefPGCR) {
			const refId = +lastRefPGCR.instanceId;
			const refTime = new Date(lastRefPGCR.period).getTime();
			searchStart = refId + ESTIMATED_PGCRS_PER_SECOND * Time.elapsed("seconds", refTime, lastDailyReset) * 2;
			searchEnd = refId + ESTIMATED_PGCRS_PER_SECOND * Time.elapsed("seconds", refTime, Date.now()) * 10;
		}

		const recentPGCR = await PGCR.getNewerThan(lastDailyReset + Time.minutes(20), searchStart, searchEnd);
		if (recentPGCR) {
			needsUpdate = true;
			versions.deepsight++;
			versions.updated = new Date().toISOString().slice(0, -5) + "Z";
			versions.lastDailyReset = lastDailyReset;
			versions.lastWeeklyReset = lastWeeklyReset;
			versions.lastTrialsReset = lastTrialsReset;
			versions.referencePostGameCarnageReportSinceDailyReset = {
				instanceId: recentPGCR.activityDetails.instanceId,
				period: recentPGCR.period,
			};
			await fs.writeFile("versions.json", JSON.stringify(versions, null, "\t") + "\n");
		}
	}

	if (!needsUpdate)
		throw new Error("No update necessary");
})();
