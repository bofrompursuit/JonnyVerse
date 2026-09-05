import type { NimbleArtResult } from "./types";

const NIMBLE_API_URL = process.env.NIMBLE_API_URL ?? "https://api.webit.live/api/v1/realtime/search";
const NIMBLE_API_KEY = process.env.NIMBLE_API_KEY;

const ART_SOURCES: Array<{ name: NimbleArtResult["source"]; domain: string }> = [
  { name: "beatport", domain: "beatport.com" },
  { name: "traxsource", domain: "traxsource.com" },
  { name: "spotify", domain: "open.spotify.com" },
];

/**
 * Wraps Nimble's real-time web-scraping API to fetch high-res cover art when
 * Engine DJ tags don't carry it. Tries Beatport, then Traxsource, then Spotify.
 * Adjust the request/response shape here if your Nimble account uses a
 * different product (SERP API vs. Web Unblocker) than the realtime search API.
 */
export class NimbleClient {
  private apiKey: string;

  constructor(apiKey = NIMBLE_API_KEY) {
    if (!apiKey) {
      throw new Error("NIMBLE_API_KEY is not set");
    }
    this.apiKey = apiKey;
  }

  async findCoverArt(title: string, artist: string): Promise<NimbleArtResult | null> {
    for (const source of ART_SOURCES) {
      const result = await this.searchSource(title, artist, source);
      if (result) return result;
    }
    return null;
  }

  private async searchSource(
    title: string,
    artist: string,
    source: { name: NimbleArtResult["source"]; domain: string },
  ): Promise<NimbleArtResult | null> {
    try {
      const res = await fetch(NIMBLE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `${artist} ${title}`,
          search_engine: "google_search",
          domain: source.domain,
          parse: true,
          render: false,
        }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const imageUrl: string | undefined =
        data?.parsing?.entities?.image_url ??
        data?.parsing?.entities?.thumbnail ??
        data?.results?.[0]?.image;

      if (!imageUrl) return null;

      return {
        cover_art_url: imageUrl,
        thumbnail_url: imageUrl,
        source: source.name,
      };
    } catch {
      return null;
    }
  }
}
