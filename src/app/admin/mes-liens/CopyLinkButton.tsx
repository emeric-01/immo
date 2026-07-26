"use client";
import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button aria-label="Copier le lien" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }} type="button"><Copy size={17}/>{copied ? " Copié" : " Copier"}</button>;
}
