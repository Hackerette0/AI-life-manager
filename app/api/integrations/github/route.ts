import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, repo } = await req.json();
    if (!token || !repo) {
      return NextResponse.json({ error: "token and repo are required" }, { status: 400 });
    }

    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return NextResponse.json({ error: "repo must be in owner/repo format" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues?state=open&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message ?? `GitHub returned ${res.status}` },
        { status: res.status }
      );
    }

    const issues = await res.json();

    const simplified = issues
      .filter((i: { pull_request?: unknown }) => !i.pull_request) // exclude PRs
      .map((i: { number: number; title: string; body?: string; html_url: string; labels?: { name: string }[] }) => ({
        number: i.number,
        title:  i.title,
        body:   i.body ? i.body.slice(0, 300) : undefined,
        url:    i.html_url,
        labels: (i.labels ?? []).map((l) => l.name),
      }));

    return NextResponse.json({ issues: simplified });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
