import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('assets/vendor/svgrepo/soco-st-various-illustration-vectors');
const source = 'https://www.svgrepo.com/collection/soco-st-various-illustration-vectors';
const mirror = 'https://www.svgviewer.dev';
const collection = 'soco-st-various-illustration-vectors';
const start = Number(process.env.SVGREPO_START || 370000);
const end = Number(process.env.SVGREPO_END || 372400);
const concurrency = Number(process.env.SVGREPO_CONCURRENCY || 16);
const debug = process.env.SVGREPO_DEBUG === '1';

fs.mkdirSync(out, { recursive: true });

const decodeHtmlEntities = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const safeSlug = (value) =>
  String(value || 'icon')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'icon';

const manifest = [];
const failures = [];

async function fetchOne(id) {
  const viewerUrl = `${mirror}/s/${id}/x`;

  try {
    const response = await fetch(viewerUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      failures.push({ id, status: response.status });
      return;
    }

    const html = await response.text();
    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
    );

    if (!match) {
      return;
    }

    const data = JSON.parse(decodeHtmlEntities(match[1]));
    const svg = data.svg || data.props?.svg || data.props?.pageProps?.svg;

    if (debug) {
      console.log(
        `probe ${id}: keys=${Object.keys(data).join(',')} props=${Object.keys(data.props || {}).join(
          ',',
        )} title=${svg?.title || ''} collection=${svg?.collection || ''} collectionname=${
          svg?.collectionname || ''
        } hasText=${Boolean(svg?.text?.includes('<svg'))}`,
      );
    }

    if (!svg || svg.collection !== collection) {
      return;
    }

    const title = svg.title || svg.slug || `icon-${id}`;
    const slug = safeSlug(svg.slug || title);
    const text = svg.text || data.optimizedSvg || '';

    if (!text.includes('<svg')) {
      failures.push({ id, error: 'No SVG text in payload' });
      return;
    }

    const file = `${id}-${slug}.svg`;
    fs.writeFileSync(path.join(out, file), text, 'utf8');

    manifest.push({
      id,
      title,
      slug,
      file,
      license: svg.license,
      author: svg.author,
      source_url: svg.svg_url,
      viewer_url: viewerUrl,
      tags: svg.tags || [],
    });

    if (manifest.length % 50 === 0) {
      console.log(`downloaded ${manifest.length}: ${id} ${title}`);
    }
  } catch (error) {
    failures.push({ id, error: error.message });
  }
}

let next = start;

async function worker() {
  while (next <= end) {
    const id = next;
    next += 1;
    await fetchOne(id);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

manifest.sort((a, b) => a.id - b.id);

fs.writeFileSync(
  path.join(out, 'manifest.json'),
  JSON.stringify(
    {
      source,
      mirror,
      collection,
      downloaded_at: new Date().toISOString(),
      count: manifest.length,
      items: manifest,
    },
    null,
    2,
  ),
  'utf8',
);

fs.writeFileSync(
  path.join(out, 'LICENSE-NOTE.txt'),
  [
    `Source collection: ${source}`,
    `Mirror used for extraction: ${mirror}`,
    'Author: soco-st',
    'License reported by svgviewer.dev/SVG Repo: CC Attribution',
    'Check individual files and source pages before public redistribution.',
    '',
  ].join('\n'),
  'utf8',
);

fs.writeFileSync(
  path.join(out, 'download-failures.json'),
  JSON.stringify(failures, null, 2),
  'utf8',
);

console.log(`DONE count=${manifest.length} failures=${failures.length} out=${out}`);
