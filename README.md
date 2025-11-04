# Cat GIF Explorer

Modern single-page experience for exploring animated cats delivered by [Cat as a Service](https://cataas.com). Built to be playful for users and maintainable for developers: the UI, controller, and API access live in separate modules wired together via a simple service container.

## Quick start

Serve the project through any static web server (local file URLs are blocked by the Cataas API because of CORS/security headers).

```bash
# clone the repository then:
cd /workspace

# option 1: using Node.js >= 18
npx --yes http-server .

# option 2: using Python 3
python -m http.server 4173
```

Now visit <http://localhost:8080> (or the port printed in your terminal) and start summoning cats.

## Project structure

- `index.html` – semantic layout, Tailwind/DaisyUI styling, hydrates the app via `src/main.js`.
- `src/main.js` – bootstraps the service container and starts the controller.
- `src/services/ServiceContainer.js` – minimal dependency-injection container.
- `src/services/CatApi.js` – API client responsible for URL composition and tag retrieval.
- `src/controllers/AppController.js` – UI orchestration, business rules, and state messaging.
- `src/ui/AppView.js` – DOM interactions, loading states, accessibility announcements.
- `src/data/surpriseCaptions.js` – curated strings for the "Surprise me" feature.

## Architecture notes

- **Separation of concerns:** view, controller, and data layers are decoupled to welcome new features (e.g., favourites, history, search) without cross-cutting changes.
- **Dependency injection:** the service container keeps responsibilities isolated and enables easy test doubles.
- **Resilient UX:** optimistic loading, graceful error recovery, and informative status updates keep the experience friendly even when the API flakes.

## Extending the app

- Add favouriting by persisting URLs in `localStorage` and surfacing them in a separate view component.
- Introduce routing (e.g., with [router-js](https://github.com/tildeio/router.js)) to support collections or tag-specific pages.
- Wire a small Jest/Vitest setup to unit-test the service and controller layers; mocking the container makes this straightforward.
- Expand the service layer to reuse responses (e.g., cache `listTags`) and to support new endpoints like filters or cat facts.

## Contributing

1. Fork and clone the repository.
2. Create a feature branch (`git checkout -b feature/amazing-idea`).
3. Make your changes, keeping commits focused and descriptive.
4. Test locally, then open a pull request.

Have fun, and pet a cat if you take a break 🐾
