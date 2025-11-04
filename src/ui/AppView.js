const STATUS_VARIANTS = {
  info: "text-slate-400",
  success: "text-secondary",
  error: "text-red-300",
};

export class AppView {
  constructor(root = document) {
    this.root = root;
    this.appRoot = root.getElementById("app");

    if (!this.appRoot) {
      throw new Error("Unable to find #app root.");
    }

    this.spinner = this._queryRequired("[data-role=spinner]");
    this.image = this._queryRequired("[data-role=cat-media]");
    this.lastSuccessfulSrc = this.image.currentSrc || this.image.src || "";
    this.status = this._queryRequired("[data-role=status]");
    this.form = this._queryRequired("[data-role=controls]");
    this.tagSelect = this._queryRequired("[data-role=tag-select]");
    this.captionInput = this._queryRequired("[data-role=caption-input]");
    this.refreshButton = this._queryRequired("[data-role=refresh-button]");
    this.surpriseButton = this._queryRequired("[data-role=surprise-button]");
    this.resetButton = this._queryRequired("[data-role=reset-button]");
    this.helper = this.appRoot.querySelector("[data-role=form-helper]");

    // Persist the default "Any mood" option for later resets.
    this.defaultTagOption = this.tagSelect.querySelector('option[value=""]');
    if (!this.defaultTagOption) {
      this.defaultTagOption = this.root.createElement("option");
      this.defaultTagOption.value = "";
      this.defaultTagOption.textContent = "Any mood";
      this.tagSelect.prepend(this.defaultTagOption);
    }

    this.setLoading(true);
  }

  bindControls({ onRequestCat, onReset, onSurprise }) {
    if (typeof onRequestCat === "function") {
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        onRequestCat(this.getFormValues());
      });
    }

    if (typeof onReset === "function") {
      this.resetButton.addEventListener("click", () => {
        onReset();
      });
    }

    if (typeof onSurprise === "function") {
      this.surpriseButton.addEventListener("click", () => {
        onSurprise();
      });
    }
  }

  getFormValues() {
    return {
      tag: this.tagSelect.value,
      caption: this.captionInput.value.trim(),
    };
  }

  setFormValues({ tag = "", caption = "" }) {
    this.tagSelect.value = tag;
    this.captionInput.value = caption;
  }

  async displayGif(url, { altText } = {}) {
    this.setLoading(true);
    this.clearStatus();

    return new Promise((resolve, reject) => {
      const previousSrc = this.lastSuccessfulSrc;
      const onLoad = () => {
        cleanup();
        this.setLoading(false);
        if (altText) {
          this.image.alt = altText;
        }
        this.lastSuccessfulSrc = this.image.src;
        resolve();
      };

      const onError = () => {
        cleanup();
        this.setLoading(false);
        if (previousSrc) {
          this.image.src = previousSrc;
          this.image.style.opacity = "1";
        }
        reject(new Error("Failed to load cat GIF"));
      };

      const cleanup = () => {
        this.image.removeEventListener("load", onLoad);
        this.image.removeEventListener("error", onError);
      };

      this.image.addEventListener("load", onLoad, { once: true });
      this.image.addEventListener("error", onError, { once: true });
      this.image.src = url;
    });
  }

  setTagOptions(tags = []) {
    const optionsToRemove = Array.from(this.tagSelect.options).filter(
      (option) => option.value !== ""
    );
    optionsToRemove.forEach((option) => option.remove());

    const fragment = this.root.createDocumentFragment();
    tags.forEach((tag) => {
      const option = this.root.createElement("option");
      option.value = tag;
      option.textContent = tag;
      fragment.appendChild(option);
    });

    this.tagSelect.appendChild(fragment);
  }

  setTagLoading(isLoading) {
    this.tagSelect.disabled = isLoading;
    if (isLoading) {
      this.setHelper("Loading moods… hold tight");
    } else {
      this.setHelper("Tip: combine a tag and a caption to craft unique, shareable loops. Captions are limited to 30 characters to keep requests snappy.");
    }
  }

  setHelper(message) {
    if (!this.helper) {
      return;
    }

    this.helper.textContent = message || "";
  }

  setLoading(isLoading) {
    this.spinner.classList.toggle("hidden", !isLoading);
    this.image.style.opacity = isLoading ? "0" : "1";
    this.appRoot.toggleAttribute("aria-busy", isLoading);
  }

  setFormDisabled(isDisabled) {
    const controls = Array.from(this.form.elements);
    controls.forEach((element) => {
      element.disabled = isDisabled;
    });
  }

  showStatus(message, variant = "info") {
    this.status.textContent = message;

    Object.values(STATUS_VARIANTS).forEach((className) => {
      this.status.classList.remove(className);
    });

    if (!message) {
      this.status.setAttribute("aria-hidden", "true");
      return;
    }

    const className = STATUS_VARIANTS[variant] || STATUS_VARIANTS.info;
    this.status.classList.add(className);
    this.status.setAttribute("aria-hidden", "false");
  }

  showError(message) {
    this.showStatus(message, "error");
  }

  showSuccess(message) {
    this.showStatus(message, "success");
  }

  clearStatus() {
    this.showStatus("");
  }

  resetForm() {
    this.tagSelect.value = "";
    this.captionInput.value = "";
  }

  focusCaption() {
    this.captionInput.focus();
  }

  _queryRequired(selector) {
    const element = this.appRoot.querySelector(selector);
    if (!element) {
      throw new Error(`Expected to find element ${selector}`);
    }
    return element;
  }
}
