#!/usr/bin/env node
// Pulls the public figures the site quotes and writes src/data/figures.json with an "as at" date.
// Every number on the site must come from this file (or a runtime fetch that falls back to it).
// Run: npm run figures   (needs network; GitHub unauthenticated limit is 60 req/h, plenty)
import { writeFile, mkdir } from 'node:fs/promises';

const GH = { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'nripeshn.github.io-figures' } };
if (process.env.GITHUB_TOKEN) GH.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function j(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function lastPage(url) { // count via the Link header of a per_page=1 request
  const r = await fetch(url, GH);
  const link = r.headers.get('link') || '';
  const m = link.match(/[?&]page=(\d+)>; rel="last"/);
  return m ? Number(m[1]) : null;
}
async function contributors(repo) {
  let all = [];
  for (let page = 1; page <= 5; page++) {
    const c = await j(`https://api.github.com/repos/${repo}/contributors?per_page=100&page=${page}`, GH);
    all = all.concat(c); if (c.length < 100) break;
  }
  return all;
}

const asAt = new Date().toISOString().slice(0, 10);
const crosstl = await j('https://api.github.com/repos/CrossGL/crosstl', GH);
const releases = await j('https://api.github.com/repos/CrossGL/crosstl/releases?per_page=1', GH);
const contribs = await contributors('CrossGL/crosstl');
const me = contribs.find(c => c.login === 'NripeshN');
const humans = contribs.filter(c => !c.login.endsWith('[bot]'));
const commits = await lastPage('https://api.github.com/repos/CrossGL/crosstl/commits?per_page=1');
const user = await j('https://api.github.com/users/NripeshN', GH);
const metalfish = await j('https://api.github.com/repos/NripeshN/MetalFish', GH);
const mlxRocm = await j('https://api.github.com/repos/ml-explore/mlx/pulls/2300', GH);
const prAll = await j('https://api.github.com/search/issues?q=author:NripeshN+is:pr+is:merged&per_page=1', GH);
await new Promise(r => setTimeout(r, 2500));
const prThird = await j('https://api.github.com/search/issues?q=author:NripeshN+is:pr+is:merged+-org:CrossGL+-user:NripeshN&per_page=1', GH);
await new Promise(r => setTimeout(r, 2500));
const prMlx = await j('https://api.github.com/search/issues?q=author:NripeshN+is:pr+is:merged+org:ml-explore&per_page=1', GH);
const pypi = await j('https://pypi.org/pypi/crosstl/json');
const panthon = await j('https://pypi.org/pypi/panthon/json');
const bot = await j('https://lichess.org/api/user/Nripesh-MetalFish');
const openalex = await j('https://api.openalex.org/works?filter=author.orcid:0009-0008-2066-1937&per_page=20');

const figures = {
  asAt,
  crosstl: {
    stars: crosstl.stargazers_count, forks: crosstl.forks_count, created: crosstl.created_at.slice(0, 10),
    license: crosstl.license?.spdx_id, description: crosstl.description, topics: crosstl.topics,
    latestRelease: releases[0]?.tag_name ?? null, latestReleaseDate: releases[0]?.published_at?.slice(0, 10) ?? null,
    defaultBranchCommits: commits, contributorAccounts: contribs.length, humanContributors: humans.length,
    myContributions: me?.contributions ?? null,
    pypiReleases: Object.keys(pypi.releases).length, pypiLatest: pypi.info.version,
  },
  github: { followers: user.followers, publicRepos: user.public_repos },
  pullRequests: { mergedTotal: prAll.total_count, mergedThirdParty: prThird.total_count, mergedMlx: prMlx.total_count },
  mlxRocmPr: { number: 2300, state: mlxRocm.state, merged: !!mlxRocm.merged_at, additions: mlxRocm.additions, updated: mlxRocm.updated_at.slice(0, 10) },
  metalfish: { stars: metalfish.stargazers_count, license: metalfish.license?.spdx_id, created: metalfish.created_at.slice(0, 10) },
  lichessBot: { username: bot.username, games: bot.count.all, draws: bot.count.draw, wins: bot.count.win, losses: bot.count.loss,
    bullet: bot.perfs?.bullet?.rating, blitz: bot.perfs?.blitz?.rating, rapid: bot.perfs?.rapid?.rating,
    firstSeen: new Date(bot.createdAt).toISOString().slice(0, 10), lastSeen: new Date(bot.seenAt).toISOString().slice(0, 10) },
  panthon: { pypiReleases: Object.keys(panthon.releases).length, latest: panthon.info.version },
  openalex: openalex.results.map(w => ({ title: w.title, doi: w.doi, year: w.publication_year, citedBy: w.cited_by_count })),
};
await mkdir('src/data', { recursive: true });
await writeFile('src/data/figures.json', JSON.stringify(figures, null, 2) + '\n');
console.log(`wrote src/data/figures.json (as at ${asAt}): CrossTL ${figures.crosstl.stars} stars, ${figures.pullRequests.mergedTotal} merged PRs, bot ${figures.lichessBot.games} games`);
