import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { parseEngineLibrary } from "@/lib/nimble/engine-parser";
import type { ParsedTrack } from "@/lib/nimble/types";

const PLACEHOLDER_COVER = "/images/placeholders/vinyl-default.png";

interface SyncEnginePayload {
  libraryPath?: string;
  tracks?: ParsedTrack[];
}

export async function POST(request: Request) {
  let body: SyncEnginePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let tracks: ParsedTrack[];
  try {
    if (body.tracks) {
      tracks = body.tracks;
    } else if (body.libraryPath) {
      tracks = await parseEngineLibrary(body.libraryPath);
    } else {
      return NextResponse.json(
        { error: "Provide either `tracks` (pre-parsed Nimble payload) or `libraryPath`" },
        { status: 400 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse Engine DJ library: ${(err as Error).message}` },
      { status: 422 },
    );
  }

  if (tracks.length === 0) {
    return NextResponse.json({ synced: 0, tracks: [] });
  }

  const rows = tracks.map((track) => ({
    title: track.title,
    artist: track.artist,
    album: track.album,
    bpm: track.bpm,
    musical_key: track.musical_key,
    genre: track.genre,
    duration: track.duration,
    cover_art_url: track.cover_art_url ?? PLACEHOLDER_COVER,
    thumbnail_url: track.thumbnail_url ?? PLACEHOLDER_COVER,
    audio_url: track.audio_url,
    engine_dj_id: track.engine_dj_id,
  }));

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tracks")
    .upsert(rows, { onConflict: "engine_dj_id" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: data?.length ?? 0, tracks: data });
}
