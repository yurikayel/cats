const DEFAULT_BASE_URL = "https://cataas.com";

/**
 * Lightweight client for the Cat as a Service API.
 * Designed to keep UI decoupled from HTTP and URL composition concerns.
 */
export class CatApi {
  constructor({ baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetch = fetchImpl;
  }

  /**
   * Build a cache-busting GIF URL honoring optional tag and caption filters.
   * No network call is made—UI layers can optimistically swap the <img> source.
   */
  buildGifUrl({ tag, caption } = {}) {
    const normalizedTag = typeof tag === "string" ? tag.trim() : "";
    const normalizedCaption = typeof caption === "string" ? caption.trim() : "";

    const path = normalizedCaption
      ? `/cat/gif/says/${encodeURIComponent(normalizedCaption)}`
      : "/cat/gif";

    const url = new URL(path, this.baseUrl);

    if (normalizedTag) {
      url.searchParams.set("tag", normalizedTag);
    }

    url.searchParams.set("timestamp", Date.now().toString());

    return url.toString();
  }

  /**
   * Retrieve the catalog of tags exposed by the public API.
   * Returns an alphabetised array for predictable UI ordering.
   */
  async listTags({ signal } = {}) {
    const response = await this.fetch(`${this.baseUrl}/api/tags`, {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status}`);
    }

    const tags = await response.json();
    return (tags || [])
      .map((tag) => String(tag).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }
}

export function createCatApi(config = {}) {
  return new CatApi(config);
}
