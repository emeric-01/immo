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
  const lines = markdown.split("\n");

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

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const cta = parseContentCta(line);

    if (cta) {
      flushParagraph();
      flushList();
      blocks.push(
        <aside className="contentCta" key={`cta-${blocks.length}`}>
          <p>{renderInline(cta.description)}</p>
          <Link href={cta.href}>{cta.label}<span aria-hidden="true"> →</span></Link>
        </aside>,
      );
      continue;
    }

    if (isTableRow(line) && isTableSeparator(lines[lineIndex + 1]?.trim() ?? "")) {
      flushParagraph();
      flushList();
      const headers = parseTableRow(line);
      const rows: string[][] = [];
      lineIndex += 2;

      while (lineIndex < lines.length && isTableRow(lines[lineIndex].trim())) {
        rows.push(parseTableRow(lines[lineIndex].trim()));
        lineIndex += 1;
      }

      lineIndex -= 1;
      blocks.push(
        <div className="contentTableScroll" key={`table-${blocks.length}`} tabIndex={0}>
          <table>
            <thead><tr>{headers.map((header, index) => <th key={`${header}-${index}`} scope="col">{renderInline(header)}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {headers.map((_, cellIndex) => <td key={`cell-${cellIndex}`}>{renderInline(row[cellIndex] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
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
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={`h3-${blocks.length}`}>{renderInline(line.slice(4))}</h3>);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{renderInline(line.slice(3))}</h2>);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{renderInline(line.slice(2))}</h2>);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return <div className={className}>{blocks}</div>;
}

function parseContentCta(line: string) {
  const match = /^:::cta\s+\[([^\]]+)]\((\/[^)\s]+)\)\s+(.+)$/.exec(line);

  if (!match) {
    return null;
  }

  return { description: match[3], href: match[2], label: match[1] };
}

function isTableRow(line: string) {
  return line.startsWith("|") && line.endsWith("|") && line.split("|").length >= 4;
}

function isTableSeparator(line: string) {
  if (!isTableRow(line)) {
    return false;
  }

  return parseTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTableRow(line: string) {
  return line.slice(1, -1).split("|").map((cell) => cell.trim());
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
      parts.push(...renderStrong(text.slice(cursor, match.index), match.index));
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
    parts.push(...renderStrong(text.slice(cursor), cursor));
  }

  return parts;
}

function renderStrong(text: string, keyOffset: number) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => (
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={`strong-${keyOffset}-${index}`}>{part.slice(2, -2)}</strong>
      : part
  ));
}
