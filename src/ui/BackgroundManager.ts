import WallpaperMoments from "model/models/WallpaperMoments";
import { Classes } from "ui/Classes";
import Component from "ui/Component";
import Arrays from "utility/Arrays";
import Env from "utility/Env";
import Functions from "utility/Functions";
import Store from "utility/Store";
import type { SupplierOr } from "utility/Type";
import Bound from "utility/decorator/Bound";

enum BackgroundClasses {
	Surface = "background-surface",
	Blur = "background-surface-blur",
	Darkened = "background-surface--darkened",
	Image = "background-image",
}

export default class Background extends Component<HTMLElement, [path: SupplierOr<Arrays.Or<string> | undefined>]> {

	private static main?: Background;
	public static async initialiseMain () {
		const moments = await WallpaperMoments.await();

		const latestMoment = moments.slice().sort((a, b) => b.hash - a.hash)[0];
		const currentYear = Math.max(...moments.map(moment => moment.moment.year ?? 0));
		const currentSeason = moments.findLast(moment => moment.moment.season);
		const currentExpansion = moments.find(moment => moment.moment.expansion && moment.moment.year === currentYear);
		const seasonsThisYear = moments.filter(moment => moment.moment.season && moment.moment.year === currentYear);
		const wallpapers = latestMoment === currentSeason && seasonsThisYear.length === 1
			? [...currentExpansion?.wallpapers ?? [], ...currentSeason.wallpapers]
			: latestMoment.wallpapers;

		if (!wallpapers.length)
			wallpapers.push(...latestMoment.wallpapers);

		const manager = this.main ??= Background
			.create([() => Store.items.settingsBackground
				?? (Store.items.settingsBackgroundNoUseDefault ? undefined
					: wallpapers[Math.floor(Math.random() * wallpapers.length)])])
			.setBlurred(() => Store.items.settingsBackgroundBlur)
			.prependTo(document.body);
		Store.event.subscribe("setSettingsBackground", manager.updateBackground);
		Store.event.subscribe("deleteSettingsBackground", manager.updateBackground);
		Store.event.subscribe("setSettingsBackgroundUseDefault", manager.updateBackground);
		Store.event.subscribe("deleteSettingsBackgroundUseDefault", manager.updateBackground);
		Store.event.subscribe("setSettingsBackgroundBlur", manager.updateBackgroundBlur);
		Store.event.subscribe("setSettingsBackgroundFollowMouse", manager.updateBackgroundFollowMouse);
	}

	private static getScrollAmount () {
		return Store.items.settingsBackgroundFollowMouse ? 0.05 : 0;
	}

	private blurred?: SupplierOr<boolean | undefined>;
	private darkened?: SupplierOr<boolean | undefined>;
	private path!: SupplierOr<Arrays.Or<string> | undefined>;

	public backgrounds!: Component<HTMLImageElement>[];

	protected override onMake (path: SupplierOr<Arrays.Or<string> | undefined>): void {
		this.path = path;
		this.classes.add(BackgroundClasses.Surface);
		this.darkened = true;

		this.backgrounds = [];

		this.updateBackground();
		this.updateBackgroundBlur();
		this.updateBackgroundDarkened();
		this.updateBackgroundFollowMouse();

		document.body.addEventListener("mousemove", event => {
			this.element.scrollLeft = (event.clientX / Component.window.width) * Component.window.width * Background.getScrollAmount();
			this.element.scrollTop = (event.clientY / Component.window.height) * Component.window.height * Background.getScrollAmount();
		});
	}

	public setPath (path: SupplierOr<string | undefined>) {
		this.path = path;
		this.updateBackground();
		return this;
	}

	public setBlurred (blurred: SupplierOr<boolean | undefined>) {
		this.blurred = blurred;
		this.updateBackgroundBlur();
		return this;
	}

	public setDarkened (darkened: SupplierOr<boolean | undefined>) {
		this.darkened = darkened;
		this.updateBackgroundDarkened();
		return this;
	}

	@Bound private updateBackground () {
		const background = Arrays.resolve(Functions.resolve(this.path));
		this.removeContents();
		this.backgrounds = [];

		if (background.length) {
			this.classes.add(Classes.Hidden);

			const remotepath = "https://deepsight.gg/";

			let loaded = 0;
			for (let i = 0; i < background.length; i++) {
				const path = background[i];
				this.backgrounds.push(Component.create("img")
					.classes.add(BackgroundClasses.Image, `${BackgroundClasses.Image}-${i}`)
					.attributes.set("src", path.startsWith(remotepath) ? `${Env.DEEPSIGHT_PATH}${path.slice(remotepath.length)}` : path)
					.event.subscribe("load", () => {
						loaded++;
						if (loaded >= background.length)
							this.classes.remove(Classes.Hidden);
					})
					.appendTo(this));
			}
		}
	}

	@Bound private updateBackgroundBlur () {
		this.classes.toggle(!!Functions.resolve(this.blurred), BackgroundClasses.Blur);
	}

	@Bound private updateBackgroundDarkened () {
		this.classes.toggle(!!Functions.resolve(this.darkened), BackgroundClasses.Darkened);
	}

	@Bound private updateBackgroundFollowMouse () {
		this.style.set("--scroll-amount", `${Background.getScrollAmount()}`);
	}
}

