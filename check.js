/* eslint-disable @typescript-eslint/no-var-requires, no-undef, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const fs = require("fs/promises");

void (async () => {
	let savedVersion;
	try {
		const versionsString = await fs.readFile("versions.json", "utf8");
		const versions = JSON.parse(versionsString) ?? {};
		savedVersion = versions["Destiny2/Manifest"];
	} catch {
		return;
	}

	let manifest;
	for (let attempts = 0; !manifest && attempts < 10; attempts++) {
		manifest = await fetch("https://www.bungie.net/Platform/Destiny2/Manifest/")
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
			await new Promise(resolve => setTimeout(resolve, 1000));
	}

	if (!manifest)
		throw new Error("Unable to get current manifest version");

	const bungieVersion = manifest.version;
	if (savedVersion !== bungieVersion)
		return;

	throw new Error("No manifest update");
})();
