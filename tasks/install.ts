import ansi from "ansicolor";
import fs from "fs-extra";
import * as path from "path";
import Log from "./utilities/Log";
import Task from "./utilities/Task";

export default Task("install", async () => {
	const lockFilePath = path.join(process.cwd(), "package-lock.json");
	let lockFileData = JSON.parse(fs.readFileSync(lockFilePath, "utf8")) as { "d2ai-module.sha"?: string };
	let sha = lockFileData["d2ai-module.sha"];

	await Task.cli({ cwd: "src" }, "PATH:npm", "install");
	if (process.env.DEEPSIGHT_ENVIRONMENT === "dev") {
		Log.info(`Installing ${ansi.lightCyan("bungie-api-ts@latest")}...`);
		await Task.cli({ cwd: "src" }, "PATH:npm", "install", "bungie-api-ts@latest");
	}

	if (process.env.DEEPSIGHT_ENVIRONMENT === "dev") {
		const commit = await fetch("https://api.github.com/repos/DestinyItemManager/d2ai-module/commits/master")
			.then(response => response.json()) as { sha: string };
		if (sha !== commit.sha) {
			sha = commit.sha;
			Log.info("Updating to d2ai @", ansi.lightGreen(sha));
		}

	} else {
		Log.info("Including d2ai @", ansi.lightGreen(sha));
	}

	if (!sha)
		throw new Error("No commit sha found for d2ai-module");

	await fetch(`https://raw.githubusercontent.com/DestinyItemManager/d2ai-module/${sha}/generated-enums.ts`)
		.then(response => response.text())
		.then(text => {
			text = text.replace(/export const/g, "export declare const");
			return fs.writeFile("src/node_modules/bungie-api-ts/destiny2/generated-enums.d.ts", text);
		});

	await fs.appendFile("src/node_modules/bungie-api-ts/destiny2/index.d.ts", "export * from './generated-enums';\n");

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	lockFileData = JSON.parse(fs.readFileSync(lockFilePath, "utf8"));
	if (lockFileData["d2ai-module.sha"] !== sha) {
		lockFileData["d2ai-module.sha"] = sha;
		fs.writeFileSync(lockFilePath, JSON.stringify(lockFileData, null, "\t") + "\n");
	}
});
