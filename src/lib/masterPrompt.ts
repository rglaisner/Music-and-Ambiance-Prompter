import type { ChoiceLayer, ExpertiseLevel } from '../constants/choices';

/** Values stored in Wizard `selections` per layer id */
export type LayerSelectionValue = string | string[] | Record<string, string>;

const LYRIC_CONTENT_LAYER_ID = 'lyricContent';
const VOCAL_IDENTITY_LAYER_ID = 'vocal-identity';
const GENRE_LAYER_ID = 'genre';
const INTENSITY_LAYER_ID = 'intensity';
const COMPOSITION_LAYER_ID = 'composition';
const ENSEMBLE_LAYER_ID = 'ensemble';
const LYRICS_LANGUAGE_LAYER_ID = 'lyrics-language';
const COMPOSITION_FORM_LAYER_ID = 'composition-form';
const SONIC_TEXTURE_LAYER_ID = 'sonic-texture';

const INTENSITY_BPM_GUIDE: Record<string, string> = {
  ambient: 'about 60–80 BPM, very spacious and low energy',
  chill: 'about 90–100 BPM, relaxed pulse',
  steady: 'about 100–115 BPM, groovy and walking pace',
  energetic: 'about 120–140 BPM, driving and active',
  explosive: 'about 150+ BPM, very fast and intense',
};

function getOptionLabel(layer: ChoiceLayer, id: string): string {
  return layer.options.find((o) => o.id === id)?.label ?? id;
}

function labelsFromIds(layer: ChoiceLayer, ids: string[]): string[] {
  return ids.map((id) => getOptionLabel(layer, id));
}

export function isInstrumentalOnlySelection(
  vocalLayer: ChoiceLayer | undefined,
  raw: LayerSelectionValue | undefined,
): boolean {
  if (!vocalLayer || vocalLayer.id !== VOCAL_IDENTITY_LAYER_ID) {
    return false;
  }
  if (!Array.isArray(raw)) {
    return false;
  }
  return raw.length === 1 && raw[0] === 'none';
}

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

function buildProseBrief(
  layers: ChoiceLayer[],
  selections: Record<string, LayerSelectionValue>,
): string {
  const findLayer = (id: string) => layers.find((l) => l.id === id);
  const genreLayer = findLayer(GENRE_LAYER_ID);
  const intensityLayer = findLayer(INTENSITY_LAYER_ID);
  const emotionalLayer = layers.find((l) => l.id === 'emotional');
  const subgenreLayer = findLayer('subgenre');
  const culturalLayer = findLayer('cultural-era');
  const compositionLayer = findLayer(COMPOSITION_LAYER_ID);
  const ensembleLayer = findLayer(ENSEMBLE_LAYER_ID);
  const vocalLayer = findLayer(VOCAL_IDENTITY_LAYER_ID);
  const languageLayer = findLayer(LYRICS_LANGUAGE_LAYER_ID);
  const compositionFormLayer = findLayer(COMPOSITION_FORM_LAYER_ID);
  const sonicTextureLayer = findLayer(SONIC_TEXTURE_LAYER_ID);
  const percussionLayer = findLayer('percussion-elements');

  const segments: string[] = [];

  const genreSel = genreLayer ? selections[genreLayer.id] : undefined;
  if (genreLayer && Array.isArray(genreSel) && genreSel.length > 0) {
    segments.push(`Blend / palette: ${labelsFromIds(genreLayer, genreSel).join(' + ')}.`);
  }

  const subSel = subgenreLayer ? selections[subgenreLayer.id] : undefined;
  if (subgenreLayer && Array.isArray(subSel) && subSel.length > 0) {
    segments.push(`Sub-style cues: ${labelsFromIds(subgenreLayer, subSel).join(' + ')}.`);
  }

  const culturalSel = culturalLayer ? selections[culturalLayer.id] : undefined;
  if (culturalLayer && Array.isArray(culturalSel) && culturalSel.length > 0) {
    segments.push(
      `Era / region flavor: ${labelsFromIds(culturalLayer, culturalSel).join(' + ')}.`,
    );
  }

  const intensitySel = intensityLayer ? selections[intensityLayer.id] : undefined;
  if (intensityLayer && typeof intensitySel === 'string') {
    const bpm = INTENSITY_BPM_GUIDE[intensitySel] ?? 'moderate energy';
    segments.push(
      `Tempo & energy: ${getOptionLabel(intensityLayer, intensitySel)} — target ${bpm}.`,
    );
  }

  const emoSel = emotionalLayer ? selections[emotionalLayer.id] : undefined;
  if (emotionalLayer && Array.isArray(emoSel) && emoSel.length > 0) {
    segments.push(`Mood & atmosphere: ${labelsFromIds(emotionalLayer, emoSel).join(' + ')}.`);
  }

  const compSel = compositionLayer ? selections[compositionLayer.id] : undefined;
  if (compositionLayer && typeof compSel === 'string') {
    segments.push(`Harmony / complexity: ${getOptionLabel(compositionLayer, compSel)}.`);
  }

  const ensSel = ensembleLayer ? selections[ensembleLayer.id] : undefined;
  if (ensembleLayer && ensSel && typeof ensSel === 'object' && !Array.isArray(ensSel)) {
    const entries = Object.entries(ensSel as Record<string, string>);
    if (entries.length > 0) {
      const parts = entries.map(
        ([id, role]) => `${getOptionLabel(ensembleLayer, id)} (${role})`,
      );
      segments.push(`Instrumentation & roles: ${parts.join(', ')}.`);
    }
  }

  const vocalRaw = vocalLayer ? selections[vocalLayer.id] : undefined;
  const instrumental = isInstrumentalOnlySelection(vocalLayer, vocalRaw);
  if (instrumental) {
    segments.push(
      'Vocals: instrumental only — prioritize arrangement and hooks in the instruments.',
    );
  } else if (vocalLayer && Array.isArray(vocalRaw) && vocalRaw.length > 0) {
    const vocalLabels = labelsFromIds(
      vocalLayer,
      vocalRaw.filter((id) => id !== 'none'),
    );
    if (vocalLabels.length > 0) {
      segments.push(`Vocal character: ${vocalLabels.join(' + ')}.`);
    }
  }

  const langSel = languageLayer ? selections[languageLayer.id] : undefined;
  if (!instrumental && languageLayer && typeof langSel === 'string') {
    segments.push(`Lyrics language: ${getOptionLabel(languageLayer, langSel)}.`);
  }

  const formSel = compositionFormLayer ? selections[compositionFormLayer.id] : undefined;
  if (compositionFormLayer && typeof formSel === 'string') {
    segments.push(`Song form / arrangement: ${getOptionLabel(compositionFormLayer, formSel)}.`);
  }

  const textureSel = sonicTextureLayer ? selections[sonicTextureLayer.id] : undefined;
  if (sonicTextureLayer && typeof textureSel === 'string') {
    segments.push(`Production / mix texture: ${getOptionLabel(sonicTextureLayer, textureSel)}.`);
  }

  const percSel = percussionLayer ? selections[percussionLayer.id] : undefined;
  if (percussionLayer && typeof percSel === 'string' && percSel !== 'none') {
    segments.push(`Percussion color: ${getOptionLabel(percussionLayer, percSel)}.`);
  }

  return segments.join(' ').trim();
}

function structureInstruction(
  expertise: ExpertiseLevel,
  hasCompositionForm: boolean,
): string | null {
  if (!hasCompositionForm) {
    return null;
  }
  if (expertise === 'Beginner' || expertise === 'Intermediate') {
    return 'Use clear sections (intro, verse, chorus, bridge as fits) with natural transitions. When writing timed lyrics, you may label them with [Intro], [Verse], [Chorus], [Bridge], [Outro].';
  }
  return 'Shape the song with explicit sectional structure. Prefer coarse timestamp cues and/or tags (e.g. [0:00–0:20] sparse intro; [Verse], [Chorus], [Bridge]) so drops and builds stay coherent.';
}

/**
 * Builds the master prompt from **only** the layers shown for the user's expertise
 * (caller passes `filteredLayers`) and the current selection snapshot.
 */
export function buildMasterPrompt(
  layers: ChoiceLayer[],
  selections: Record<string, LayerSelectionValue>,
  expertise: ExpertiseLevel,
): string {
  const vocalLayer = layers.find((l) => l.id === VOCAL_IDENTITY_LAYER_ID);
  const instrumental = isInstrumentalOnlySelection(
    vocalLayer,
    selections[VOCAL_IDENTITY_LAYER_ID],
  );

  const prose = buildProseBrief(layers, selections);
  const lines = layers.map((layer) => formatLayerLine(layer, selections[layer.id]));
  const lyricRaw = selections[LYRIC_CONTENT_LAYER_ID];
  const hasLyricBrief = typeof lyricRaw === 'string' && lyricRaw.trim().length > 0;

  const hasCompForm =
    layers.some((l) => l.id === COMPOSITION_FORM_LAYER_ID) &&
    typeof selections[COMPOSITION_FORM_LAYER_ID] === 'string';

  const structureNote = structureInstruction(expertise, hasCompForm);

  const languageLayer = layers.find((l) => l.id === LYRICS_LANGUAGE_LAYER_ID);
  const langId =
    !instrumental && languageLayer && typeof selections[LYRICS_LANGUAGE_LAYER_ID] === 'string'
      ? (selections[LYRICS_LANGUAGE_LAYER_ID] as string)
      : null;
  const langLine =
    langId && languageLayer
      ? `\nLyrics should be sung in **${getOptionLabel(languageLayer, langId)}** (match pronunciation and idioms to that language).`
      : '';

  const instrumentalLine = instrumental
    ? '\n**Vocal policy:** Instrumental only, no vocals. Do not add sung or spoken lead vocals; wordless textures only if they read as instrumentation, not a lead singer.'
    : '';

  const durationBlock =
    "**Duration:** Create a full track about **2:30–2:55** (hard cap ~2:55 / ~175s) so delivery stays within app limits; do not exceed ~3 minutes.\n**Output:** Professional stereo mix, cohesive arrangement, intentional dynamics.";

  const lyricDirectionBlock = hasLyricBrief
    ? `

---
### Creative direction for lyrics (not fixed script)
${String(lyricRaw).trim()}

When generating lyrics, reflect this imagery and narrative, honor the vocal identity and language above, and use section tags ([Verse], [Chorus], etc.) in the timed lyric output unless the track is instrumental.`
    : !instrumental
      ? `

When generating lyrics, align with the moods, language, and vocal identity above; use section tags in the timed lyric output where helpful.`
      : '';

  let header = `Create a polished full-length music track (Lyria-style brief).\n\n${durationBlock}\n${instrumentalLine}${langLine}\n\n### Creative brief (natural language)\n${prose || 'Use the technical checklist below to infer style.'}\n`;

  if (structureNote) {
    header += `\n**Structure note:** ${structureNote}\n`;
  }

  const body = `

---
### Technical checklist (wizard layers; source of truth for edge details)
${lines.join('\n')}
`;

  const footer = `\nEnsure the result feels like one intentional production — not a random loop — and respects every constraint above.`;

  return `${header}${body}${lyricDirectionBlock}${footer}`;
}

