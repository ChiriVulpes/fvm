# deepsight.gg
deepsight.gg provides a number of manifests generated automatically to make development with the Destiny 2 API easier.

**The primary usage of this package is the TypeScript definitions.** That said, the current manifests do come with.

**It's recommended to handle updating these manifests in the same way that you handle updating the Bungie.NET Destiny 2 manifest.** If you update the D2 manifest only when you can manually verify that your app works with it, update deepsight.gg manifests at the same time. If you instead keep it up to date on client machines or servers based on polling for version changes, you should do the same with the deepsight.gg manifests.

If you use any of these manifests, please credit and link to [deepsight.gg](https://deepsight.gg)! It's not actually a requirement, but it would be super appreciated!

## Live Updates
The latest manifests are always available at `https://deepsight.gg/manifest/*`

To only download when there's new versions, use [`versions.json`](https://deepsight.gg/manifest/versions.json). For more detail, see the [documentation](https://github.com/ChiriVulpes/deepsight.gg/wiki/Versions).

## Manual Updates
If you want to choose when to update to new versions of the deepsight.gg manifests manually, you have a few options:

- If you want to be as manual as possible, you can just download the [`manifest` branch](https://github.com/ChiriVulpes/deepsight.gg/tree/manifest) directly.
- You can add the [`manifest` branch](https://github.com/ChiriVulpes/deepsight.gg/tree/manifest) as a submodule.
- You can use the manifests provided by this package!
