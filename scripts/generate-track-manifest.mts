import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseEngineLibrary } from "../lib/nimble/engine-parser.ts";

const DEFAULT_LIBRARY_PATH = "/Volumes/T7 Shield/Engine DJ - Jonny Purse";

/**
 * Snapshots the Engine DJ library into a static public/tracks.json so the
 * Music Library carousel works on Vercel without a database — Vercel's
 * serverless functions can't see the local T7 drive, so this is generated
 * locally and committed. Re-run whenever the T7 library changes:
 *   npm run generate-tracks
 */
async function main() {
  const libraryPath = process.argv[2] ?? process.env.ENGINE_DJ_LIBRARY_PATH ?? DEFAULT_LIBRARY_PATH;
  console.log(`Parsing Engine DJ library at: ${libraryPath}`);

  const tracks = await parseEngineLibrary(libraryPath);
  console.log(`Parsed ${tracks.length} tracks`);

  const outPath = path.join(process.cwd(), "public", "tracks.json");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify({ tracks, generatedAt: new Date().toISOString() }));

  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
