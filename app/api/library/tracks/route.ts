import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { parseEngineLibrary } from "@/lib/nimble/engine-parser";
import type { ParsedTrack } from "@/lib/nimble/types";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60_000;
let cache: { tracks: ParsedTrack[]; expiresAt: number } | null = null;

/**
 * Serves the Music Library carousel. Reads from Supabase (populated by
 * POST /api/library/sync-engine) when configured; otherwise falls back to
 * parsing the Engine DJ folder directly, so the carousel works in local dev
 * before Supabase credentials exist.
 */
export async function GET() {
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json({ tracks: cache.tracks });
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tracks = data as unknown as ParsedTrack[];
    cache = { tracks, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json({ tracks });
  }

  const libraryPath = process.env.ENGINE_DJ_LIBRARY_PATH;
  if (!libraryPath) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await parseEngineLibrary(libraryPath);
    cache = { tracks, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json({ tracks });
  } catch (err) {
    return NextResponse.json({ error: `Failed to read Engine DJ library: ${(err as Error).message}` }, { status: 500 });
  }
}
