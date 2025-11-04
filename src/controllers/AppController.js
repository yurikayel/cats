import { SURPRISE_CAPTIONS } from "../data/surpriseCaptions.js";

export class AppController {
  constructor({ catService, view, random = Math.random } = {}) {
    if (!catService) {
      throw new Error("AppController requires a catService instance");
    }

    if (!view) {
      throw new Error("AppController requires a view instance");
    }

    this.catService = catService;
    this.view = view;
    this.random = typeof random === "function" ? random : Math.random;
    this.availableTags = [];
  }

  init() {
    this.view.bindControls({
      onRequestCat: (payload) => this.handleRequestCat(payload),
      onReset: () => this.handleReset(),
      onSurprise: () => this.handleSurprise(),
    });

    this.view.setTagLoading(true);
    this.loadTags();
    this.loadCat();
  }

  async loadTags() {
    try {
      const tags = await this.catService.listTags();
      this.availableTags = tags;
      this.view.setTagOptions(tags);
    } catch (error) {
      console.warn("Failed to load cat tags", error);
      this.view.showStatus(
        "Tag suggestions are snoozing right now. You can still fetch random cats!"
      );
    } finally {
      this.view.setTagLoading(false);
    }
  }

  async loadCat({ tag = "", caption = "" } = {}) {
    this.view.setFormDisabled(true);
    try {
      const gifUrl = this.catService.buildGifUrl({ tag, caption });
      const altText = this.buildAltText({ tag, caption });
      await this.view.displayGif(gifUrl, { altText });
      this.view.showSuccess(this.buildStatusMessage({ tag, caption }));
    } catch (error) {
      console.error("Unable to load cat GIF", error);
      this.view.showError(
        "We could not load a cat right now. Please try again in a few seconds."
      );
    } finally {
      this.view.setFormDisabled(false);
    }
  }

  handleRequestCat(options) {
    this.loadCat(options);
  }

  handleReset() {
    this.view.resetForm();
    this.view.clearStatus();
    this.loadCat();
  }

  handleSurprise() {
    const tag = this.pickRandomTag();
    const caption = this.pickRandomCaption();
    this.view.setFormValues({ tag, caption });
    this.loadCat({ tag, caption });
  }

  pickRandomTag() {
    if (!this.availableTags.length) {
      return "";
    }

    const index = Math.floor(this.random() * this.availableTags.length);
    return this.availableTags[index];
  }

  pickRandomCaption() {
    if (!SURPRISE_CAPTIONS.length) {
      return "";
    }

    const index = Math.floor(this.random() * SURPRISE_CAPTIONS.length);
    return SURPRISE_CAPTIONS[index];
  }

  buildAltText({ tag, caption }) {
    const details = [tag, caption].filter(Boolean).join(" · ");
    return details ? `Animated cat (${details})` : "Animated cat";
  }

  buildStatusMessage({ tag, caption }) {
    const pieces = [];
    if (tag) {
      pieces.push(`#${tag}`);
    }
    if (caption) {
      pieces.push(`“${caption}”`);
    }

    if (!pieces.length) {
      return "Serving a fresh random cat GIF.";
    }

    return `Serving a cat GIF with ${pieces.join(" and ")}.`;
  }
}
