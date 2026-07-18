import Link from "next/link";
import type { ReactNode } from "react";

type MarkdownContentProps = {
  className?: string;
  markdown: string;
};

export function MarkdownContent({ className, markdown }: MarkdownContentProps) {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "))}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) {
      return;
    }

    blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>)}</ul>);
    list = [];
  };

  markdown.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={`h3-${blocks.length}`}>{renderInline(line.slice(4))}</h3>);
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{renderInline(line.slice(3))}</h2>);
      return;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{renderInline(line.slice(2))}</h2>);
      return;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div className={className}>{blocks}</div>;
}

function renderInline(text: string) {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }

    const label = match[1];
    const href = match[2];
    const isExternal = href.startsWith("http");
    parts.push(isExternal ? (
      <a key={`${href}-${match.index}`} href={href} rel="noreferrer" target="_blank">{label}</a>
    ) : (
      <Link key={`${href}-${match.index}`} href={href}>{label}</Link>
    ));
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}
