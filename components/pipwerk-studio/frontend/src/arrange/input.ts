import type { ExpressionBlock } from '../api/objects';
import type { StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import {
  cardRows,
  isCardElement,
  managementOwner,
  outputsOf,
  ownsManagement,
  type ExpressionReference,
} from '../model/elements';
import type { TypeIndex } from '../model/typeIndex';
import type { UsageModel } from '../model/uses';
import type { Pt, SceneInput, SceneStep } from './scene';

/**
 * The properties of an object that expressions address, taken from the blocks of the expressions of an element: the
 * blocks that are names with a path of at least two identifiers (an instance and one of its properties). A path
 * that names more identifiers (a property of a contained instance) counts for the first two.
 */
export function referencesOfBlocks(block: ExpressionBlock | null): ExpressionReference[] {
  const found: ExpressionReference[] = [];
  const visit = (current: ExpressionBlock): void => {
    if (current.kind === 'name' && current.path !== undefined && current.path.length >= 2) {
      const [instance, property] = current.path;
      if (instance !== undefined && property !== undefined) {
        found.push({ instance, property });
      }
    }
    for (const child of current.children ?? []) {
      visit(child);
    }
  };
  if (block !== null) {
    visit(block);
  }
  return found;
}

/**
 * Reduces the document to what the arrangement needs. `uses` says which element uses which instance and where each
 * card sits, `open` names the cards that show all their rows, `places` places that override the stored ones (an
 * element or card the user is dragging).
 */
export function buildSceneInput(
  document: StrategyDocument,
  types: TypeIndex,
  language: SupportedLanguage,
  open: ReadonlySet<string>,
  uses: Pick<UsageModel, 'links' | 'homes'>,
  places: ReadonlyMap<string, Pt> = new Map(),
): SceneInput {
  const steps: SceneStep[] = [];
  const cards: SceneInput['cards'] = [];
  for (const element of document.elements) {
    const type = types.byId.get(element.type);
    if (isCardElement(element, types)) {
      cards.push({
        id: element.id,
        rows: cardRows(type, element.instance, language).map((row) => row.id),
        usedRows: [...new Set(uses.links.filter((link) => link.src === element.id).flatMap((link) => link.rows))],
        open: open.has(element.id),
        home: uses.homes.get(element.id) ?? null,
        pos: places.get(element.id) ?? element.position,
      });
      continue;
    }
    steps.push({
      id: element.id,
      kind: type === undefined ? 'unknown' : type.kind === 'trigger' ? 'trigger' : 'flow',
      mgmt: managementOwner(element, document, types),
      outputs: outputsOf(element, type, document, language).map((output) => ({
        id: output.id,
        management: output.management,
      })),
      hasFrame: ownsManagement(element, document, types),
      pos: places.get(element.id) ?? element.position,
    });
  }
  return {
    steps,
    cards,
    connections: document.connections.map((connection) => ({
      id: connection.id,
      from: connection.source,
      out: connection.output,
      to: connection.target,
    })),
    sections: document.sections.map((section) => ({
      id: section.id,
      flow: section.flow,
      elements: section.elements,
      collapsed: section.collapsed,
    })),
    collapsedManagements: document.collapsed_managements,
    links: uses.links.map((link) => ({ key: link.key, src: link.src, dst: link.dst, first: link.first, rows: link.rows })),
  };
}
