import { createServiceContainer } from "./services/ServiceContainer.js";
import { createCatApi } from "./services/CatApi.js";
import { AppView } from "./ui/AppView.js";
import { AppController } from "./controllers/AppController.js";

const container = createServiceContainer();

container.register("random", () => () => Math.random());
container.register("catService", () => createCatApi());
container.register("view", () => new AppView(document));
container.register(
  "appController",
  (c) =>
    new AppController({
      catService: c.get("catService"),
      view: c.get("view"),
      random: c.get("random"),
    })
);

function bootstrap() {
  container.get("appController").init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
