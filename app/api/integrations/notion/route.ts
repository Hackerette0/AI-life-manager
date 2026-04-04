import { NextRequest, NextResponse } from "next/server";

type NotionRichText = { plain_text: string };
type NotionProperty =
  | { type: "title";       title: NotionRichText[] }
  | { type: "rich_text";   rich_text: NotionRichText[] }
  | { type: "checkbox";    checkbox: boolean }
  | { type: "select";      select: { name: string } | null }
  | { type: "status";      status: { name: string } | null }
  | { type: "url";         url: string | null }
  | { [key: string]: unknown };

interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, NotionProperty>;
}

function extractTitle(props: Record<string, NotionProperty>): string {
  for (const val of Object.values(props)) {
    if (val.type === "title") {
      const titleProp = val as { type: "title"; title: NotionRichText[] };
      if (titleProp.title?.length) {
        return titleProp.title.map((t) => t.plain_text).join("");
      }
    }
  }
  return "Untitled";
}

function isLikelyTask(props: Record<string, NotionProperty>): boolean {
  const keys = Object.keys(props).map((k) => k.toLowerCase());
  return keys.some((k) =>
    ["status", "done", "checkbox", "complete", "checked", "priority", "due"].some((t) => k.includes(t))
  );
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, databaseId } = await req.json();
    if (!apiKey || !databaseId) {
      return NextResponse.json({ error: "apiKey and databaseId are required" }, { status: 400 });
    }

    const cleanId = databaseId.replace(/-/g, "");

    const res = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 50 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message ?? `Notion returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const pages: NotionPage[] = data.results ?? [];

    const tasks: { title: string; url: string }[] = [];
    const notes: { title: string; content: string; url: string }[] = [];

    for (const page of pages) {
      const title = extractTitle(page.properties);
      if (!title || title === "Untitled") continue;

      if (isLikelyTask(page.properties)) {
        tasks.push({ title, url: page.url });
      } else {
        notes.push({ title, content: "", url: page.url });
      }
    }

    return NextResponse.json({ tasks, notes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
