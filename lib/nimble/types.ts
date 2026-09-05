export interface ParsedTrack {
  title: string;
  artist: string;
  album: string | null;
  bpm: number | null;
  musical_key: string | null;
  duration: string | null;
  genre: string | null;
  cover_art_url: string | null;
  thumbnail_url: string | null;
  audio_url: string;
  engine_dj_id: string;
}

export interface NimbleArtResult {
  cover_art_url: string;
  thumbnail_url: string;
  source: "beatport" | "traxsource" | "spotify";
}
