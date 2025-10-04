import { loadLicenseTracks, saveLicenseTracks } from "../storage.js";

interface SyncOptions {
  states?: string;
  tracks?: string;
}

function parseList(input?: string): string[] | undefined {
  if (!input) {
    return undefined;
  }
  return input
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

export function syncCommand(options: SyncOptions): void {
  const states = parseList(options.states);
  const tracksFilter = options.tracks
    ? options.tracks.split(",").map((value) => value.trim()).filter(Boolean)
    : undefined;

  const licenseTracks = loadLicenseTracks();
  const now = new Date().toISOString();

  const updated = licenseTracks.map((track) => {
    if (states && !states.includes(track.stateCode.toUpperCase())) {
      return track;
    }
    if (tracksFilter && !tracksFilter.includes(track.track)) {
      return track;
    }
    return {
      ...track,
      notes: `Last synced ${now}`,
    };
  });

  saveLicenseTracks(updated);
  // eslint-disable-next-line no-console
  console.log(`Synced ${updated.length} license track(s).`);
}
