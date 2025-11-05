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
    this.errorContainer = this.appRoot.querySelector("[data-role=error-container]");
    this.errorMessage = this.appRoot.querySelector("[data-role=error-message]");
    this.retryButton = this.appRoot.querySelector("[data-role=retry-button]");

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

  bindControls({ onRequestCat, onReset, onSurprise, onRetry }) {
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

    if (typeof onRetry === "function" && this.retryButton) {
      this.retryButton.addEventListener("click", () => {
        this.hideError();
        onRetry();
      });
    }

    // Keyboard navigation improvements
    this._setupKeyboardNavigation();
  }

  _setupKeyboardNavigation() {
    // Allow Enter key on inputs to submit form
    this.captionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.form.requestSubmit();
      }
    });

    // Escape key to reset form when focused on form inputs
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && (event.target === this.tagSelect || event.target === this.captionInput)) {
        event.preventDefault();
        this.resetForm();
        this.tagSelect.blur();
        this.captionInput.blur();
      }
    });

    // Handle skip link focus
    const skipLink = this.root.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (event) => {
        event.preventDefault();
        this.focusMainContent();
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
    this.hideError();

    return new Promise((resolve, reject) => {
      const previousSrc = this.lastSuccessfulSrc;
      const timeoutId = setTimeout(() => {
        cleanup();
        this.setLoading(false);
        this.showError("Loading is taking longer than expected. Please check your connection.");
        reject(new Error("Image load timeout"));
      }, 30000); // 30 second timeout

      const onLoad = () => {
        clearTimeout(timeoutId);
        cleanup();
        this.setLoading(false);
        if (altText) {
          this.image.alt = altText;
        } else {
          this.image.alt = "A playful cat GIF";
        }
        this.image.style.opacity = "1";
        this.lastSuccessfulSrc = this.image.src;
        
        // Announce to screen readers
        this.status.setAttribute("aria-live", "polite");
        resolve();
      };

      const onError = () => {
        clearTimeout(timeoutId);
        cleanup();
        this.setLoading(false);
        if (previousSrc) {
          this.image.src = previousSrc;
          this.image.style.opacity = "1";
        }
        this.showError("Failed to load cat GIF. Please try again.");
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
      this.setHelper("🐱 Loading moods… hold tight! ✨");
    } else {
      this.setHelper("💡 Pro Tip: Combine a tag and a caption to craft unique, shareable cat moments! Captions are limited to 30 characters. 🎨");
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
    if (isLoading) {
      this.image.style.opacity = "0";
    }
    this.appRoot.toggleAttribute("aria-busy", isLoading);
    this.appRoot.setAttribute("aria-busy", isLoading ? "true" : "false");
    
    // Update form disabled state
    this.setFormDisabled(isLoading);
  }

  showError(message) {
    if (this.errorContainer && this.errorMessage) {
      this.errorMessage.textContent = message || "An error occurred. Please try again.";
      this.errorContainer.classList.remove("hidden");
      this.errorContainer.setAttribute("aria-hidden", "false");
      this.errorContainer.setAttribute("role", "alert");
      
      // Focus retry button for keyboard users
      if (this.retryButton) {
        setTimeout(() => {
          this.retryButton.focus();
        }, 100);
      }
    }
    this.showStatus(message, "error");
  }

  hideError() {
    if (this.errorContainer) {
      this.errorContainer.classList.add("hidden");
      this.errorContainer.setAttribute("aria-hidden", "true");
      this.errorContainer.removeAttribute("role");
    }
  }

  setFormDisabled(isDisabled) {
    const controls = Array.from(this.form.elements);
    controls.forEach((element) => {
      element.disabled = isDisabled;
    });
    
    // Also disable action buttons
    [this.refreshButton, this.surpriseButton, this.resetButton].forEach((button) => {
      if (button) {
        button.disabled = isDisabled;
      }
    });
  }

  showStatus(message, variant = "info") {
    if (!this.status) return;

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
    
    // Update live region based on variant
    if (variant === "error") {
      this.status.setAttribute("aria-live", "assertive");
    } else {
      this.status.setAttribute("aria-live", "polite");
    }
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
    this.clearStatus();
    this.hideError();
  }

  focusCaption() {
    this.captionInput.focus();
  }

  focusMainContent() {
    // Scroll to main content and focus first interactive element
    this.appRoot.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      this.tagSelect.focus();
    }, 100);
  }

  _queryRequired(selector) {
    const element = this.appRoot.querySelector(selector);
    if (!element) {
      throw new Error(`Expected to find element ${selector}`);
    }
    return element;
  }
}
