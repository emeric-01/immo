import Link from "next/link";
import type { ReactNode } from "react";
import { ContentImage } from "./ContentImage";

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

    const image = parseMarkdownImage(line);

    if (image) {
      flushParagraph();
      flushList();
      blocks.push(
        <figure key={`image-${blocks.length}`}>
          <ContentImage
            alt={image.alt}
            height={image.height}
            loading="lazy"
            sizes="(max-width: 820px) calc(100vw - 64px), 664px"
            src={image.src}
            width={image.width}
          />
          {image.alt ? <figcaption>{image.alt}</figcaption> : null}
        </figure>,
      );
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

function parseMarkdownImage(line: string) {
  const match = /^!\[([^\]]*)]\((https?:\/\/[^)\s]+|\/[^)\s]+)(?:\s+["'](\d+)x(\d+)["'])?\)$/.exec(line);

  if (!match) {
    return null;
  }

  const width = Number(match[3]);
  const height = Number(match[4]);

  return {
    alt: match[1],
    height: Number.isInteger(height) && height > 0 ? height : 1000,
    src: match[2],
    width: Number.isInteger(width) && width > 0 ? width : 1600,
  };
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
