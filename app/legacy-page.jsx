import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ClientBoot from './client-boot';

const pages = {
  'index.html': { page: 'care', className: 'app-page' },
  'care.html': { page: 'care', className: 'app-page' },
  'review.html': { page: 'review', className: 'app-page' },
  'family.html': { page: 'family', className: 'app-page' },
  'system.html': { page: 'system', className: 'studio' },
  'experience.html': { page: 'system', className: 'studio', source: 'dist/index.html' },
};

export const legacyPages = Object.keys(pages);

export function LegacyPage({ file }) {
  const config = pages[file];
  if (!config) throw new Error(`Unknown page: ${file}`);
  const source = readFileSync(join(process.cwd(), config.source || file), 'utf8');
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error(`No body found in ${file}`);
  let markup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  if (file === 'experience.html') markup = markup.replaceAll('href="index.html"', 'href="experience.html"');
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: markup }} suppressHydrationWarning />
      <ClientBoot page={config.page} bodyClass={config.className} />
    </>
  );
}
