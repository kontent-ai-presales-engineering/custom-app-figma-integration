import type { FigmaNode } from "../types/figma.ts";
import type { KontentElementType, VariantElementValue } from "../types/kontent.ts";

export interface MappedElement {
  readonly name: string;
  readonly codename: string;
  readonly type: KontentElementType;
  readonly textValue?: string;
}

/** Converts a human-readable name to a valid Kontent.ai codename. */
export const toCodename = (name: string): string => {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 55);
  // Must start with a letter
  const result = /^[a-z]/.test(sanitized) ? sanitized : `el_${sanitized}`;
  return result || "element";
};

/** Ensures a codename is unique within the given set, appending a counter if needed. */
const deduplicateCodename = (base: string, seen: Set<string>): string => {
  if (!seen.has(base)) return base;
  let counter = 2;
  while (seen.has(`${base}_${counter}`)) counter++;
  return `${base}_${counter}`;
};

// Ordered semantic names for text and asset elements (first match wins, then numbered)
const TEXT_SEMANTIC_NAMES = ["Headline", "Subheading", "Body"];
const ASSET_SEMANTIC_NAME = "Image";

/**
 * Returns true when Figma auto-named a text layer (layer name equals its text content).
 * Figma trims and truncates long names, so we check prefix equality for long strings.
 */
const isAutoNamed = (nodeName: string, characters: string): boolean => {
  const trimmed = characters.trim();
  return nodeName === trimmed || trimmed.startsWith(nodeName);
};

/**
 * Picks a semantic display name for a text element based on how many text elements
 * have already been added (textCount = 0-based index of this text element).
 */
const semanticTextName = (textCount: number): string =>
  TEXT_SEMANTIC_NAMES[textCount] ?? `Body ${textCount - TEXT_SEMANTIC_NAMES.length + 2}`;

/**
 * Recursively walks a Figma frame's children and maps layers to Kontent.ai elements.
 *
 * Mapping rules:
 * - TEXT nodes → `text` element; value = node.characters
 * - Nodes with at least one IMAGE fill → `asset` element (value left empty)
 * - All other nodes are skipped (but their children are still traversed)
 *
 * Naming: when Figma auto-named a layer (name == text content), logical semantic names
 * are used instead ("Headline", "Subheading", "Body", …). Custom layer names are kept.
 */
export const mapFrameToElements = (frame: FigmaNode): readonly MappedElement[] => {
  const elements: MappedElement[] = [];
  const seenCodenames = new Set<string>();
  let textCount = 0;
  let assetCount = 0;

  const visit = (node: FigmaNode) => {
    if (node.visible === false) return;

    if (node.type === "TEXT" && node.characters !== undefined && node.characters.trim() !== "") {
      const useSemanticName = isAutoNamed(node.name, node.characters);
      const displayName = useSemanticName ? semanticTextName(textCount) : node.name;
      textCount++;
      const base = toCodename(displayName);
      const codename = deduplicateCodename(base, seenCodenames);
      seenCodenames.add(codename);
      elements.push({ name: displayName, codename, type: "text", textValue: node.characters });
      return; // Don't recurse into text nodes
    }

    const hasImageFill = node.fills?.some(
      (f) => f.type === "IMAGE" && f.visible !== false,
    ) ?? false;

    if (hasImageFill && node.type !== "TEXT") {
      assetCount++;
      const displayName = assetCount === 1 ? ASSET_SEMANTIC_NAME : `${ASSET_SEMANTIC_NAME} ${assetCount}`;
      const base = toCodename(displayName);
      const codename = deduplicateCodename(base, seenCodenames);
      seenCodenames.add(codename);
      elements.push({ name: displayName, codename, type: "asset" });
      // Still recurse in case there are text children
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };

  if (frame.children) {
    for (const child of frame.children) {
      visit(child);
    }
  }

  return elements;
};

/** Builds the variant element values array from mapped elements (text only; assets are left empty). */
export const buildVariantElements = (elements: readonly MappedElement[]): readonly VariantElementValue[] =>
  elements.map((el) => {
    if (el.type === "text") {
      return { element: { codename: el.codename }, value: el.textValue ?? "" };
    }
    // asset elements require an array value
    return { element: { codename: el.codename }, value: [] };
  });
