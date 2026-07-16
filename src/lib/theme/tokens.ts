/**
 * A tiny reader for the design tokens in `src/app/globals.css`.
 *
 * The CSS stays the single source of truth (Tailwind v4 is CSS-first, so
 * `@theme` is what generates `bg-canvas` et al). This module exists so tests can
 * hold that CSS to account — every colour needs a dark counterpart, and every
 * ink/surface pairing needs to clear WCAG AA — without duplicating the palette
 * into TypeScript, where it would silently drift.
 *
 * Deliberately not a general CSS parser: it reads the two block shapes we
 * author and nothing more.
 */

/** Custom-property name -> raw value, e.g. `--color-ink` -> `#2c271f`. */
export type Tokens = Record<string, string>;

/**
 * Return the body of the brace-delimited block opened by `header`, counting
 * braces so nested rules (`@media { :root { … } }`) survive intact.
 */
function blockBody(css: string, header: string | RegExp): string | null {
  const match = css.match(header);
  if (match?.index === undefined) return null;

  const open = css.indexOf("{", match.index);
  if (open === -1) return null;

  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  return null; // unbalanced braces
}

/** Collect every `--name: value;` declaration in a chunk of CSS. */
function declarations(css: string): Tokens {
  const tokens: Tokens = {};
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

/** Light-theme tokens — the `@theme` block Tailwind builds utilities from. */
export function themeTokens(css: string): Tokens {
  const body = blockBody(css, /@theme\b/);
  return body ? declarations(body) : {};
}

/** Dark-theme overrides — the `@media (prefers-color-scheme: dark)` block. */
export function darkTokens(css: string): Tokens {
  const body = blockBody(css, /@media\s*\(\s*prefers-color-scheme\s*:\s*dark/);
  return body ? declarations(body) : {};
}
