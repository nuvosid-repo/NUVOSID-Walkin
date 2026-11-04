export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(date: Date | string | null | undefined) {
  return date ? dateFormat.format(new Date(date)) : "—";
}

export function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function coverUrl(project: { id: string; coverExt: string; updatedAt: Date }) {
  return project.coverExt ? `/api/covers/${project.id}?v=${project.updatedAt.getTime()}` : null;
}
