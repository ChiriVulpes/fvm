import type { AnsicolorMethods } from "ansicolor";
import ansi from "ansicolor";
import { performance } from "perf_hooks";

export type Stopwatch = ReturnType<typeof stopwatch>;

export function stopwatch () {
	const start = performance.now();
	let elapsedTime: number | undefined;

	function stop () {
		if (elapsedTime === undefined)
			elapsedTime = performance.now() - start;
	}

	return {
		get elapsed () {
			return elapsedTime ?? performance.now() - start;
		},
		stop,
		time: () => (stop(), elapsed(elapsedTime!)),
	};
}

export function elapsed (elapsed: number) {
	return ansi.magenta(elapsedRaw(elapsed));
}

function elapsedRaw (elapsed: number) {
	if (elapsed < 1)
		return `${Math.floor(elapsed * 1_000)} μs`;

	if (elapsed < 1_000)
		return `${Math.floor(elapsed)} ms`;

	if (elapsed < 60_000)
		return `${+(elapsed / 1_000).toFixed(2)} s`;

	return `${+(elapsed / 60_000).toFixed(2)} m`;
}

const format = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", second: "numeric", hour12: false, timeZone: "Australia/Melbourne" });
export function timestamp (color: keyof AnsicolorMethods = "darkGray") {
	return ansi[color](format.format(new Date()));
}

export default class Time {
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
		const daysRemaining = (2 - new Date().getUTCDay() + 7) % 7;
		return this.nextDailyReset + daysRemaining * Time.days(1);
	}

	static days (days: number) {
		return days * 1000 * 60 * 60 * 24;
	}

}
