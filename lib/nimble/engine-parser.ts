import { readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { NimbleClient } from "./nimble-client.ts";
import type { ParsedTrack } from "./types.ts";

const AUDIO_EXTENSIONS = new Set([".mp3", ".flac", ".wav", ".aiff", ".m4a", ".ogg"]);

function engineDjId(filePath: string): string {
  return createHash("sha1").update(filePath).digest("hex");
}

function formatDuration(seconds?: number): string | null {
  if (!seconds || Number.isNaN(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function findAudioFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip AppleDouble/.dotfiles from ExFAT
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findAudioFiles(fullPath)));
    } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Parses an Engine DJ export/sync folder (e.g. "T7/Engine DJ - Jonnypurse") by
 * reading tags directly off each audio file, rather than the proprietary
 * Engine Library SQLite schema (which varies across Engine DJ versions).
 * Missing cover art is backfilled via Nimble.
 */
export async function parseEngineLibrary(libraryPath: string): Promise<ParsedTrack[]> {
  const st = await stat(libraryPath);
  if (!st.isDirectory()) {
    throw new Error(`Engine DJ library path is not a directory: ${libraryPath}`);
  }

  const audioFiles = await findAudioFiles(libraryPath);
  const nimble = process.env.NIMBLE_API_KEY ? new NimbleClient() : null;

  const tracks: ParsedTrack[] = [];

  for (const filePath of audioFiles) {
    try {
      const track = await parseTrackFile(filePath, nimble);
      tracks.push(track);
    } catch (err) {
      console.error(`[engine-parser] failed to parse ${filePath}:`, err);
    }
  }

  return tracks;
}

async function parseTrackFile(filePath: string, nimble: NimbleClient | null): Promise<ParsedTrack> {
  const metadata = await parseFile(filePath, { duration: true });
  const common = metadata.common;
  const format = metadata.format;

  const title = common.title ?? path.basename(filePath, path.extname(filePath));
  const artist = common.artist ?? common.albumartist ?? "Unknown Artist";

  let coverArtUrl: string | null = null;
  let thumbnailUrl: string | null = null;

  const embeddedPicture = common.picture?.[0];
  if (embeddedPicture) {
    try {
      // Downscale to a small thumbnail — embedded FLAC art can be several MB,
      // which is unusable once base64-inlined across hundreds of tracks.
      const thumbnail = await sharp(Buffer.from(embeddedPicture.data))
        .resize(200, 200, { fit: "cover" })
        .jpeg({ quality: 72 })
        .toBuffer();
      coverArtUrl = `data:image/jpeg;base64,${thumbnail.toString("base64")}`;
      thumbnailUrl = coverArtUrl;
    } catch (err) {
      console.error(`[engine-parser] failed to downscale embedded art for ${filePath}:`, err);
    }
  }

  if (!coverArtUrl && nimble) {
    const enriched = await nimble.findCoverArt(title, artist);
    if (enriched) {
      coverArtUrl = enriched.cover_art_url;
      thumbnailUrl = enriched.thumbnail_url;
    }
  }

  return {
    title,
    artist,
    album: common.album ?? null,
    bpm: common.bpm ? Math.round(common.bpm) : null,
    musical_key: common.key ?? null,
    duration: formatDuration(format.duration),
    genre: common.genre?.[0] ?? null,
    cover_art_url: coverArtUrl,
    thumbnail_url: thumbnailUrl,
    audio_url: filePath,
    engine_dj_id: engineDjId(filePath),
  };
}
