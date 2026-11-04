"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

async function copyText(text: string) {
  // navigator.clipboard only exists on https or localhost
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function CopyButton({ text, label = "Copy", variant = "secondary", className }: { text: string; label?: string; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button variant={variant} size="sm" onClick={handleClick} className={className}>
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}
