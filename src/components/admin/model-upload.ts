import { unzip } from "fflate";
import { isJunkModelPath, MAX_MODEL_BYTES, MAX_MODEL_FILES, MODEL_CHUNK_BYTES } from "@/lib/constants";

export type PreparedFiles = { kind: "html" | "zip"; files: { path: string; data: Uint8Array }[] };
export type UploadProgress = { sent: number; total: number };

const PARALLEL_REQUESTS = 4;
const RETRIES = 2;

export function fileFromHtml(html: string): PreparedFiles {
  return { kind: "html", files: [{ path: "index.html", data: new TextEncoder().encode(html) }] };
}

export async function filesFromUpload(file: File): Promise<PreparedFiles> {
  const data = new Uint8Array(await file.arrayBuffer());
  if (/\.html?$/i.test(file.name)) return { kind: "html", files: [{ path: "index.html", data }] };
  if (!/\.zip$/i.test(file.name)) throw new Error("Upload an .html or .zip file.");

  const files = await readZip(data);
  if (!files.length) throw new Error("This ZIP is empty.");
  if (!files.some((entry) => /\.html?$/i.test(entry.path))) {
    throw new Error("No HTML file found in this ZIP. Include an index.html.");
  }
  return { kind: "zip", files };
}

function readZip(data: Uint8Array) {
  let declared = 0;
  let count = 0;
  let tooLarge = false;

  return new Promise<PreparedFiles["files"]>((resolve, reject) => {
    unzip(
      data,
      {
        filter(entry) {
          if (isJunkModelPath(entry.name)) return false;
          declared += entry.originalSize;
          count += 1;
          if (declared > MAX_MODEL_BYTES || count > MAX_MODEL_FILES) tooLarge = true;
          return !tooLarge;
        },
      },
      (error, unzipped) => {
        if (error) reject(new Error("This file couldn't be read as a ZIP."));
        else if (tooLarge) reject(new Error("This model is larger than the 200 MB limit once extracted."));
        else resolve(Object.entries(unzipped).map(([path, bytes]) => ({ path, data: bytes })));
      },
    );
  });
}

type Piece = { path: string; index: number; total: number; data: Uint8Array };

function splitIntoPieces(files: PreparedFiles["files"]) {
  const pieces: Piece[] = [];
  for (const file of files) {
    const total = Math.max(1, Math.ceil(file.data.byteLength / MODEL_CHUNK_BYTES));
    for (let index = 0; index < total; index++) {
      const data = file.data.subarray(index * MODEL_CHUNK_BYTES, (index + 1) * MODEL_CHUNK_BYTES);
      pieces.push({ path: file.path, index, total, data });
    }
  }
  return pieces;
}

async function readJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new UploadRefused(result.error ?? "The upload failed. Please try again.", response.status);
  return result;
}

class UploadRefused extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function sendPiece(url: string, version: string, piece: Piece) {
  const query = new URLSearchParams({ version, path: piece.path, index: String(piece.index), total: String(piece.total) });
  for (let attempt = 0; ; attempt++) {
    try {
      const body = new Blob([piece.data.slice()]);
      await readJson(await fetch(`${url}?${query}`, { method: "PUT", body }));
      return;
    } catch (error) {
      // A refusal won't change on retry; a dropped connection or server hiccup might.
      const refused = error instanceof UploadRefused && error.status < 500;
      if (refused || attempt >= RETRIES) throw error;
    }
  }
}

/** Sends a model in small pieces, because Vercel rejects any single request over 4.5 MB. */
export async function uploadModel(projectId: string, prepared: PreparedFiles, onProgress: (progress: UploadProgress) => void) {
  const url = `/api/admin/projects/${projectId}/model`;
  const pieces = splitIntoPieces(prepared.files);
  const total = pieces.reduce((sum, piece) => sum + piece.data.byteLength, 0);
  if (total > MAX_MODEL_BYTES) throw new Error("This model is larger than the 200 MB limit.");

  const post = (body: object) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const { version } = await readJson(await post({ action: "start" }));

  let sent = 0;
  let cursor = 0;
  onProgress({ sent, total });
  const worker = async () => {
    while (cursor < pieces.length) {
      const piece = pieces[cursor++];
      await sendPiece(url, version, piece);
      sent += piece.data.byteLength;
      onProgress({ sent, total });
    }
  };
  await Promise.all(Array.from({ length: PARALLEL_REQUESTS }, worker));

  const result = await readJson(await post({ action: "finish", version, kind: prepared.kind }));
  return { warnings: (result.warnings ?? []) as string[] };
}
