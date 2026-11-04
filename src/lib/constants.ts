export const PROPERTY_TYPES = ["Residential", "Commercial", "Mixed use", "Villa", "Plot", "Retail / Showroom"] as const;
export const PROJECT_STATUSES = ["Upcoming", "Under construction", "Ready to move", "Completed"] as const;
// Vercel rejects request bodies over 4.5 MB, so anything sent to the server stays under that.
export const MAX_COVER_BYTES = 4 * 1024 * 1024;
export const MODEL_CHUNK_BYTES = 3 * 1024 * 1024;
// Atlas's free cluster holds 512 MB in total.
export const MAX_MODEL_BYTES = 200 * 1024 * 1024;
export const MAX_MODEL_FILES = 5000;

export function isJunkModelPath(path: string) {
  return (
    path.endsWith("/") ||
    path.startsWith("__MACOSX/") ||
    path.split("/").some((part) => part === ".DS_Store" || part === "Thumbs.db")
  );
}
