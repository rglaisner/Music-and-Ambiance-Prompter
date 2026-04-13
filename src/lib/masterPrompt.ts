import type { ChoiceLayer } from '../constants/choices';

/** Values stored in Wizard `selections` per layer id */
export type LayerSelectionValue = string | string[] | Record<string, string>;

const LYRIC_CONTENT_LAYER_ID = 'lyricContent';

function formatLayerLine(
  layer: ChoiceLayer,
  selection: LayerSelectionValue | undefined,
): string {
  if (selection === undefined) {
    return `${layer.title}: (not specified — infer sensibly from the other layers)`;
  }

  if (layer.hasRoles) {
    const entries = Object.entries(selection as Record<string, string>);
    if (entries.length === 0) {
      return `${layer.title}: (none selected)`;
    }
    const formatted = entries.map(([id, role]) => {
      const label = layer.options.find((o) => o.id === id)?.label || id;
      return `${label} (${role})`;
    });
    return `${layer.title}: ${formatted.join(', ')}`;
  }

  if (Array.isArray(selection)) {
    if (selection.length === 0) {
      return `${layer.title}: (none selected)`;
    }
    const labels = selection.map(
      (id) => layer.options.find((o) => o.id === id)?.label || id,
    );
    return `${layer.title}: ${labels.join(' & ')}`;
  }

  if (layer.type === 'text') {
    const text = String(selection).trim();
    if (!text) {
      return `${layer.title}: (not specified)`;
    }
    return `${layer.title}: ${text}`;
  }

  const option = layer.options.find((o) => o.id === selection);
  return `${layer.title}: ${option?.label ?? String(selection)}`;
}

/**
 * Builds the master prompt from **only** the layers shown for the user's expertise
 * (caller passes `filteredLayers`) and the current selection snapshot.
 */
export function buildMasterPrompt(
  layers: ChoiceLayer[],
  selections: Record<string, LayerSelectionValue>,
): string {
  const lines = layers.map((layer) => formatLayerLine(layer, selections[layer.id]));

  const header = `Generate a complete, structured music track with the following architectural specifications. Only the layers below apply (they match the user's chosen expertise level; any category not listed was out of scope for this session):

**Duration:** Keep the finished audio to at most approximately **2 minutes 55 seconds** total (about 175 seconds). Aim for a ~2:30–2:55 runtime so the full MP3 stays within the app's delivery size limit—do not exceed ~3 minutes.

`;

  let body = lines.join('\n');

  const lyricRaw = selections[LYRIC_CONTENT_LAYER_ID];
  const hasLyricBrief =
    typeof lyricRaw === 'string' && lyricRaw.trim().length > 0;

  let footer = `\n\nThe track should be a cohesive masterpiece that captures the essence of these choices.`;

  if (hasLyricBrief) {
    footer += `\n\nGive maximum priority to the "${layers.find((l) => l.id === LYRIC_CONTENT_LAYER_ID)?.title ?? 'Lyrical Content & Imagery'}" entry above: the lyrics must reflect that narrative, imagery, and keywords, together with the Lyrics Language and vocal choices in this list.`;
  } else {
    footer += `\n\nIf lyrics are included, they should align with the language, style, and themes specified in the layers above.`;
  }

  return `${header}${body}${footer}`;
}
