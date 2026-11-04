"use client";

import { clsx } from "clsx";
import { Code2, Eye, FileUp, TriangleAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { FormAlert } from "@/components/ui/form-alert";
import { formatBytes, formatDate } from "@/lib/format";

type ModelInfo = {
  kind: string;
  size: number;
  fileCount: number;
  uploadedAt: Date | null;
} | null;

type Mode = "paste" | "file";

export function ModelManager({ projectId, model }: { projectId: string; model: ModelInfo }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("paste");
  const [html, setHtml] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const url = `/api/admin/projects/${projectId}/model`;
  const canSubmit = mode === "paste" ? html.trim().length > 0 : !!file;

  function upload() {
    const body = new FormData();
    if (mode === "paste") body.set("html", html);
    else if (file) body.set("file", file);

    setError(undefined);
    setSuccess(undefined);
    setWarnings([]);

    startTransition(async () => {
      try {
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(result.error ?? "The upload failed. Please try again.");
          return;
        }
        setHtml("");
        setFile(null);
        setFileInputKey((key) => key + 1);
        setWarnings(result.warnings ?? []);
        setSuccess("3D model uploaded.");
        router.refresh();
      } catch {
        setError("The upload failed. Check your connection and try again.");
      }
    });
  }

  async function remove() {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) {
      setError("The model couldn't be removed. Please try again.");
      return;
    }
    setSuccess(undefined);
    setWarnings([]);
    router.refresh();
  }

  return (
    <div className="space-y-5 p-5">
      {model ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-bg px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              Current model <Badge tone="gold">{model.kind === "zip" ? "ZIP bundle" : "HTML"}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              {model.fileCount} {model.fileCount === 1 ? "file" : "files"} · {formatBytes(model.size)} · Uploaded {formatDate(model.uploadedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/preview/${projectId}`} className={buttonClass("secondary", "sm")}>
              <Eye className="size-3.5" aria-hidden /> Preview
            </Link>
            <ConfirmButton
              ariaLabel="Remove 3D model"
              title="Remove 3D model?"
              description="Users will see “3D coming soon” on this project until a new model is uploaded."
              confirmLabel="Remove model"
              onConfirm={remove}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </ConfirmButton>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">No model yet. Until one is uploaded, users see “3D coming soon” on this project.</p>
      )}

      <div>
        <div role="tablist" aria-label="Upload method" className="mb-4 inline-flex rounded-lg border border-line bg-bg p-1">
          <Tab active={mode === "paste"} onClick={() => setMode("paste")} icon={<Code2 className="size-3.5" aria-hidden />}>Paste HTML code</Tab>
          <Tab active={mode === "file"} onClick={() => setMode("file")} icon={<FileUp className="size-3.5" aria-hidden />}>Upload file</Tab>
        </div>

        {mode === "paste" ? (
          <div>
            <label htmlFor="model-html" className="mb-1.5 block text-[13px] font-medium text-soft">HTML code</label>
            <textarea
              id="model-html"
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              rows={10}
              spellCheck={false}
              placeholder={"<!DOCTYPE html>\n<html>\n  ...\n</html>"}
              className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-muted">Works when all the code is in this one page. If it loads other files, use a ZIP instead.</p>
          </div>
        ) : (
          <div>
            <label htmlFor="model-file" className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-line-strong bg-bg px-6 py-10 text-center transition-colors hover:border-gold">
              <FileUp className="mb-3 size-6 text-muted" aria-hidden />
              <span className="text-sm font-medium">{file ? file.name : "Choose an .html or .zip file"}</span>
              <span className="mt-1 text-xs text-muted">{file ? formatBytes(file.size) : "Up to 300 MB"}</span>
            </label>
            <input
              key={fileInputKey}
              id="model-file"
              type="file"
              accept=".html,.htm,.zip"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-1.5 text-xs text-muted">Use a ZIP when the walkthrough has extra files such as three.module.js, audio or textures. Keep index.html inside it, and link files with relative paths.</p>
          </div>
        )}
      </div>

      {warnings.map((warning) => (
        <p key={warning} role="alert" className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {warning}
        </p>
      ))}
      <FormAlert error={error} success={warnings.length ? undefined : success} />

      <Button onClick={upload} pending={pending} disabled={!canSubmit}>
        {pending ? "Uploading…" : model ? "Replace model" : "Upload model"}
      </Button>
    </div>
  );
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors",
        active ? "bg-raised text-ink" : "text-muted hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
