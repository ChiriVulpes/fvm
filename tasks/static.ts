import fs from "fs-extra";
import deepsight_manifest from "./deepsight_manifest";
import JSON5 from "./utilities/JSON5";
import Log from "./utilities/Log";
import Task from "./utilities/Task";

export default Task("static", async task => {
	while (!await fs.copy("static", "docs")
		.then(() => true).catch(() => false));

	for (const json5File of await fs.readdir("docs/manifest")) {
		if (!json5File.endsWith(".json5"))
			continue;

		const content = await fs.readFile(`docs/manifest/${json5File}`, "utf8");
		await fs.unlink(`docs/manifest/${json5File}`);

		const jsonText = JSON5.convertToJSON(content);

		try {
			// ensure conversion worked correctly
			JSON.parse(jsonText);
		} catch (err) {
			Log.error(`Failed to convert ${json5File} to JSON:`, err);
			continue;
		}

		await fs.writeFile(`docs/manifest/${json5File.slice(0, -5)}json`, jsonText);
	}

	await task.run(deepsight_manifest);
});
