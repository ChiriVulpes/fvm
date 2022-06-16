import Button from "ui/Button";
import View from "ui/View";
import Bungie from "utility/endpoint/bungie/Bungie";

export default View.create({
	id: "settings",
	name: "Settings",
	initialiseDestinationButton: button =>
		button.text.remove(),
	initialise: view => view.content
		.setTitle(title => title.text.set("Settings"))
		.append(Button.create()
			.text.set("Sign Out")
			.event.subscribe("click", () => Bungie.resetAuthentication())),
});
