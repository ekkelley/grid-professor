import "server-only";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * Pull a guide published as a web page into the content system as Markdown.
 *
 * Today this reads David's generated skill guides (public pages on app.gridprof.com). The durable
 * path is his generator writing Markdown straight into the content system through the API; until
 * then an admin imports by URL and the source link is kept on the item (stored_at).
 */
export type ImportedGuide = { title: string; markdown: string };

const ALLOWED_HOSTS = new Set(["app.gridprof.com"]);

export async function importGuideFromUrl(rawUrl: string): Promise<ImportedGuide> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error("Guides can only be imported from app.gridprof.com.");
  }

  const response = await fetch(url, { headers: { accept: "text/html" }, cache: "no-store" });
  if (!response.ok) throw new Error(`The guide page returned ${response.status}.`);
  const html = await response.text();

  const title = decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").trim() || url.pathname;
  // Pages may omit the body tags (valid HTML5), so fall back to the document minus its head.
  const bodyHtml = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, "");

  const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  turndown.use(gfm);
  turndown.remove(["script", "style", "nav", "noscript", "title", "head"]);
  // The page's own H1 repeats the title we store on the item.
  turndown.addRule("drop-h1", { filter: "h1", replacement: () => "" });
  // Relative links (the PDF copy) must keep pointing at the source site.
  turndown.addRule("absolute-links", {
    filter: (node) => node.nodeName === "A" && !!node.getAttribute("href"),
    replacement: (content, node) => {
      const href = (node as HTMLElement).getAttribute("href") ?? "";
      const absolute = new URL(href, url).toString();
      return content.trim() ? `[${content}](${absolute})` : "";
    },
  });

  const markdown = turndown.turndown(bodyHtml).replace(/\n{3,}/g, "\n\n").trim();
  if (markdown.length < 200) throw new Error("The page had too little text to be a guide.");
  return { title, markdown };
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}
