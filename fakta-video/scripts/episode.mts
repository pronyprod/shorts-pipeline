// Loads an episode's script module from a version id: "ep002" -> src/episodes/ep002-script.ts,
// "ep001v3" -> src/episodes/ep001-script.ts. Each module exports VERSIONS (and VOICE for Gemini).
import path from "node:path";
import { pathToFileURL } from "node:url";

export type Segment = { id: string; say: string };
export const loadEpisode = async (id: string) => {
  const base = id.match(/^ep\d{3}/)?.[0];
  if (!base) throw new Error(`bad episode id "${id}" (expected ep002, ep001v3, ...)`);
  const mod = await import(pathToFileURL(path.resolve(import.meta.dirname, "..", "src", "episodes", `${base}-script.ts`)).href);
  const segments: readonly Segment[] | undefined = mod.VERSIONS?.[id];
  if (!segments) throw new Error(`no VERSIONS["${id}"] in ${base}-script.ts`);
  return { segments, voice: mod.VOICE ?? mod.VOICE_V3, edge: mod.EP };
};
