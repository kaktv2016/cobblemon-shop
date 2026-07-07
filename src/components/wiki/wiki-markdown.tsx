import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/utils";

export type WikiHeading = {
  id: string;
  text: string;
  level: number;
};

function flattenText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement(child)) {
        const element = child as ReactElement<{ children?: ReactNode }>;
        return flattenText(element.props.children);
      }

      return "";
    })
    .join("")
    .trim();
}

function stripMarkdownFormatting(value: string) {
  return value
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .trim();
}

function createUniqueHeadingId(rawText: string, usedIds: Map<string, number>) {
  const baseId = slugify(rawText) || "section";
  const count = usedIds.get(baseId) ?? 0;
  usedIds.set(baseId, count + 1);
  return count === 0 ? baseId : `${baseId}-${count + 1}`;
}

export function extractMarkdownHeadings(markdown: string) {
  const usedIds = new Map<string, number>();

  return markdown
    .split(/\r?\n/)
    .flatMap<WikiHeading>((line) => {
      const match = line.match(/^(#{2,4})\s+(.+)$/);

      if (!match) {
        return [];
      }

      const level = match[1].length;
      const text = stripMarkdownFormatting(match[2]);

      if (!text) {
        return [];
      }

      return [
        {
          id: createUniqueHeadingId(text, usedIds),
          text,
          level,
        },
      ];
    });
}

function createHeadingResolver(headings: WikiHeading[]) {
  const matches = new Map<string, WikiHeading[]>();
  const seen = new Map<string, number>();

  for (const heading of headings) {
    const key = `${heading.level}:${heading.text}`;
    const bucket = matches.get(key) ?? [];
    bucket.push(heading);
    matches.set(key, bucket);
  }

  return (text: string, level: number) => {
    const cleaned = stripMarkdownFormatting(text);
    const key = `${level}:${cleaned}`;
    const index = seen.get(key) ?? 0;
    seen.set(key, index + 1);

    const matched = matches.get(key)?.[index];
    if (matched) {
      return matched.id;
    }

    return slugify(cleaned) || "section";
  };
}

export function WikiMarkdown({
  content,
  headings = extractMarkdownHeadings(content),
}: {
  content: string;
  headings?: WikiHeading[];
}) {
  const resolveHeadingId = createHeadingResolver(headings);

  const components: Components = {
    h2: ({ children, ...props }) => {
      const text = flattenText(children);
      return (
        <h2 id={resolveHeadingId(text, 2)} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = flattenText(children);
      return (
        <h3 id={resolveHeadingId(text, 3)} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const text = flattenText(children);
      return (
        <h4 id={resolveHeadingId(text, 4)} {...props}>
          {children}
        </h4>
      );
    },
    a: ({ children, href, ...props }) => {
      const isExternal = href?.startsWith("http");

      return (
        <a
          href={href}
          {...props}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }) => (
      <img
        src={src ?? ""}
        alt={alt ?? ""}
        loading="lazy"
        {...props}
      />
    ),
    code: ({ children, className, ...props }) => (
      <code className={className} {...props}>
        {children}
      </code>
    ),
  };

  return (
    <div className="wiki-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
