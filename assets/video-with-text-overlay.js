import { timeline, inView } from "./vendor.min.js";

function waitForMediaLayer(el) {
  if (!el) return Promise.resolve();
  if (el.matches?.("svg")) return Promise.resolve();
  if (el.tagName === "IMG") {
    return new Promise((resolve) => {
      if (el.complete) resolve();
      else el.onload = () => resolve();
    });
  }
  if (el.tagName?.toLowerCase() === "video-media") {
    const video = el.querySelector("video");
    if (!video) return Promise.resolve();
    return new Promise((resolve) => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) resolve();
      else video.addEventListener("canplay", () => resolve(), { once: true });
    });
  }
  return Promise.resolve();
}

class VideoWithTextOverlay extends HTMLElement {
  #skipInitialTransition = false;

  constructor() {
    super();
    if (window.Shopify?.designMode) {
      this.closest(".shopify-section")?.addEventListener("shopify:section:select", (event) => {
        this.#skipInitialTransition = event.detail.load;
      });
    }
  }

  connectedCallback() {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    if (this.getAttribute("reveal-on-scroll") !== "true") return;
    inView(this, ({ target }) => this.#onBecameVisible(target), { amount: 0.05 });
  }

  async #onBecameVisible(target) {
    const media =
      target.querySelector(".content-over-media > video-media") ||
      target.querySelector(".content-over-media > picture img") ||
      target.querySelector(".content-over-media > svg");
    const content = target.querySelector(".content-over-media > .content");

    await waitForMediaLayer(media);

    const segments = [[target, { opacity: 1 }]];
    if (media) {
      segments.push([
        media,
        {
          opacity: [0, 1],
          scale: [1.1, 1],
          easing: [0.215, 0.61, 0.355, 1],
          duration: 0.8,
        },
      ]);
    }
    if (content) {
      segments.push([content, { opacity: [0, 1], duration: 0.8 }]);
    }

    const animationControls = timeline(segments);
    if (this.#skipInitialTransition) {
      animationControls.finish();
    }
  }
}

if (!window.customElements.get("video-with-text-overlay")) {
  window.customElements.define("video-with-text-overlay", VideoWithTextOverlay);
}
