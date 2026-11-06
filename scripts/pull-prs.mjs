#!/usr/bin/env node
// Pulls the title and merge date of each pull request listed in content/prs.source.json and writes
// content/prs.json, which the build renders as the "Macs have GPUs" table. Run with the figures.
import { readFileSync, writeFileSync } from 'node:fs';
const GH = { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'nripeshn.github.io-prs' } };
if (process.env.GITHUB_TOKEN) GH.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const src = JSON.parse(readFileSync('content/prs.source.json', 'utf8'));
const out = [];
for (const row of src) {
  const [owner, repo] = row.repo.split('/');
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${row.number}`, GH);
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    out.push({ ...row, title: d.title, merged: d.merged_at ? d.merged_at.slice(0, 10) : null, additions: d.additions, deletions: d.deletions, url: d.html_url });
    console.log(`${row.repo}#${row.number}: ${d.title} (${d.merged_at?.slice(0, 10) ?? 'not merged'})`);
  } catch (e) {
    out.push({ ...row, title: null, merged: null, url: `https://github.com/${row.repo}/pull/${row.number}` });
    console.log(`${row.repo}#${row.number}: ${e.message}`);
  }
}
writeFileSync('content/prs.json', JSON.stringify({ asAt: new Date().toISOString().slice(0, 10), prs: out }, null, 2) + '\n');
