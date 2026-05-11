/**
 * Expands <!-- @include partials/foo.html --> in index.html at build/dev time.
 * Partials live in /partials (single HTML fragments; supports nested @include).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function htmlIncludePlugin(partialsDir = 'partials') {
  const resolvedRoot = path.resolve(path.join(__dirname, '..'), partialsDir);
  const includeRe = /<!--\s*@include\s+([\w./-]+\.html)\s*-->/g;

  function expand(html, stack = []) {
    return html.replace(includeRe, (_, rel) => {
      const clean = rel.trim().replace(/^\.\//, '');
      const filePath = path.join(resolvedRoot, clean);
      if (!fs.existsSync(filePath)) {
        throw new Error(`[html-include] Missing partial: ${filePath}`);
      }
      if (stack.includes(filePath)) {
        throw new Error(`[html-include] Circular include: ${stack.join(' → ')} → ${filePath}`);
      }
      let inner = fs.readFileSync(filePath, 'utf-8');
      inner = expand(inner, [...stack, filePath]);
      return inner;
    });
  }

  return {
    name: 'vite-html-include',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return expand(html);
      },
    },
  };
}
