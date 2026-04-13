export type ExpertiseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

/** Layer IDs omitted when purely instrumental. */
export const INSTRUMENTAL_SKIP_LAYER_IDS: readonly string[] = [
  'lyrics-language',
  'lyricContent',
  'lyric-style',
  'contentRating',
  'vocal-delivery',
] as const;

export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
}

export interface ChoiceLayer {
  id: string;
  title: string;
  question: string;
  type?: 'options' | 'text';
  group: 'Core Architecture' | 'Instrumentation' | 'Vocal Architecture' | 'Final Mix';
  multiSelect?: boolean;
  hasRoles?: boolean;
  maxSelections?: number;
  featuredOptionIds?: string[];
  beginnerTitle?: string;
  beginnerQuestion?: string;
  layerHint?: string;
  defaultForBeginner?: string | string[];
  minExpertise: ExpertiseLevel;
  options: ChoiceOption[];
  presets?: string[]; // For text type "pick for me"
}

export const MUSIC_LAYERS: ChoiceLayer[] = [
  // --- Core Architecture ---
  {
    id: "genre",
    title: "Primary Genre",
    question: "What is the foundation of your sound?",
    beginnerTitle: "Genre",
    beginnerQuestion:
      "Pick a main genre and up to one cross-influence (max 2). What foundation should the track sit on?",
    layerHint: "This steers rhythm, instrumentation, and overall production clichés the model reaches for.",
    maxSelections: 2,
    featuredOptionIds: ['electronic', 'rock', 'hiphop', 'ambient', 'jazz', 'soul'],
    group: 'Core Architecture',
    multiSelect: true,
    minExpertise: 'Beginner',
    options: [
      { id: "electronic", label: "Electronic", description: "Synthesizers, drum machines, and digital textures." },
      { id: "rock", label: "Rock", description: "Electric guitars, powerful drums, and raw energy." },
      { id: "jazz", label: "Jazz", description: "Improvisation, complex harmonies, and swing." },
      { id: "classical", label: "Classical", description: "Orchestral arrangements and timeless structures." },
      { id: "hiphop", label: "Hip Hop", description: "Beats, rhythm, and urban storytelling." },
      { id: "ambient", label: "Ambient", description: "Atmospheric textures and evolving soundscapes." },
      { id: "metal", label: "Metal", description: "Heavy distortion, fast tempos, and aggressive energy." },
      { id: "country", label: "Country", description: "Storytelling, string instruments, and vocal twang." },
      { id: "reggae", label: "Reggae", description: "Off-beat rhythms, heavy bass, and relaxed vibes." },
      { id: "soul", label: "Soul / R&B", description: "Emotional vocals, groove, and rich harmonies." },
      { id: "folk", label: "Folk", description: "Acoustic instruments and traditional storytelling." },
      { id: "world", label: "World", description: "Diverse global rhythms and traditional instruments." },
    ],
  },
  {
    id: "subgenre",
    title: "Stylistic Refinement",
    question: "Narrow down the specific sub-genre or style.",
    beginnerTitle: "Sub-style",
    beginnerQuestion: "Optional: add a more specific flavor (max 2).",
    layerHint: "Narrows arrangement clichés (e.g. lo-fi vs techno) without replacing your main genre.",
    maxSelections: 2,
    featuredOptionIds: ['synthwave', 'lofi', 'techno', 'neo-soul', 'indie-folk', 'afrobeat'],
    group: 'Core Architecture',
    multiSelect: true,
    minExpertise: 'Intermediate',
    options: [
      { id: "synthwave", label: "Synthwave / Retro-Future", description: "80s nostalgia with a futuristic twist." },
      { id: "techno", label: "Techno / Industrial", description: "Repetitive, driving beats for the dancefloor." },
      { id: "grunge", label: "Grunge / Alternative", description: "Distorted guitars and angst-filled melodies." },
      { id: "bebop", label: "Bebop / Fusion", description: "Fast-paced jazz with intricate solos." },
      { id: "baroque", label: "Baroque / Romantic", description: "Ornate and highly structured classical music." },
      { id: "lofi", label: "Lo-fi / Chillhop", description: "Relaxed beats with a vintage, dusty feel." },
      { id: "death-metal", label: "Death / Black Metal", description: "Extreme distortion and aggressive textures." },
      { id: "outlaw-country", label: "Outlaw / Bluegrass", description: "Raw, rebellious, and traditional string music." },
      { id: "roots-reggae", label: "Roots / Dub", description: "Spiritual and socially conscious reggae." },
      { id: "neo-soul", label: "Neo-Soul / Funk", description: "Modern blend of soul, jazz, and hip hop." },
      { id: "indie-folk", label: "Indie Folk / Americana", description: "Modern acoustic music with a DIY spirit." },
      { id: "afrobeat", label: "Afrobeat / Highlife", description: "Complex polyrhythms and big band energy." },
    ],
  },
  {
    id: "intensity",
    title: "Intensity & Pace",
    question: "How fast and energetic should the track be?",
    beginnerTitle: "Energy & tempo",
    beginnerQuestion: "How fast and energetic should it feel?",
    layerHint: "Sets implied BPM range and how busy the rhythm section should be.",
    defaultForBeginner: 'steady',
    group: 'Core Architecture',
    minExpertise: 'Beginner',
    options: [
      { id: "ambient", label: "Ambient & Ethereal", description: "Slow (60-80 BPM), low intensity, and spacious." },
      { id: "chill", label: "Chill & Mellow", description: "Moderate (90-100 BPM), relaxed but steady pulse." },
      { id: "steady", label: "Steady & Groovy", description: "Moderate (100-115 BPM), walking pace, engaging." },
      { id: "energetic", label: "Energetic & Driving", description: "Fast (120-140 BPM), active, and intense." },
      { id: "explosive", label: "Explosive & Frantic", description: "Very Fast (150+ BPM), maximum power and impact." },
    ],
  },
  {
    id: "emotional",
    title: "Emotional Architecture",
    question: "What is the core emotional arc of the music and lyrics?",
    beginnerTitle: "Mood",
    beginnerQuestion: "What’s the dominant mood? You can add a second (max 2).",
    layerHint: "Drives harmonic tension, lyric tone, and how bright or heavy the mix feels.",
    maxSelections: 2,
    featuredOptionIds: ['hopeful', 'melancholic', 'euphoric', 'dark', 'bittersweet', 'serene'],
    defaultForBeginner: ['hopeful'],
    group: 'Core Architecture',
    multiSelect: true,
    minExpertise: 'Beginner',
    options: [
      { id: "melancholic", label: "Melancholic & Vulnerable", description: "Sad, reflective, and rawly exposed." },
      { id: "euphoric", label: "Euphoric & Awe-struck", description: "Joyful, triumphant, and overwhelmed by beauty." },
      { id: "dark", label: "Dark & Ominous", description: "Mysterious, intense, and slightly resentful." },
      { id: "hopeful", label: "Hopeful & Defiant", description: "Optimistic, bright, and standing strong." },
      { id: "aggressive", label: "Aggressive & Confrontational", description: "Powerful, fierce, and direct." },
      { id: "serene", label: "Serene & Detached", description: "Peaceful, calm, and analytically distant." },
      { id: "bittersweet", label: "Bittersweet & Nostalgic", description: "A mix of happiness, sadness, and reflection." },
    ],
  },
  {
    id: "composition",
    title: "Compositional Depth",
    question: "How intricate should the musical and harmonic foundation be?",
    beginnerTitle: "Harmony & complexity",
    beginnerQuestion: "How intricate should chords and scales feel?",
    layerHint: "Rough guide for modality (major/minor) and how ‘busy’ harmony should be.",
    group: 'Core Architecture',
    minExpertise: 'Advanced',
    options: [
      { id: "simple-major", label: "Simple & Bright (Major)", description: "Easy to follow, happy, and clear." },
      { id: "moderate-minor", label: "Moderate & Serious (Minor)", description: "Balanced, mysterious, and emotive." },
      { id: "complex-technical", label: "Complex & Technical", description: "Intricate layers and technical playing." },
      { id: "experimental-exotic", label: "Experimental & Exotic", description: "Phrygian scales, rule-breaking, and new ground." },
      { id: "avant-garde", label: "Avant-Garde / Chromatic", description: "Dissonant, complex, and highly modern." },
    ],
  },
  {
    id: "cultural-era",
    title: "Cultural & Era Influence",
    question: "Which time period or regional flavor should it echo?",
    beginnerTitle: "Era & region",
    beginnerQuestion: "Any era or regional flavor to lean into (max 2)?",
    layerHint: "Colors production choices (tape warmth, drum machines, scale flavors).",
    maxSelections: 2,
    featuredOptionIds: [
      'modern-global',
      '80s-retro',
      '70s-analog',
      'futuristic-unheard',
      'latin-passionate',
      'east-asian-zen',
    ],
    group: 'Core Architecture',
    multiSelect: true,
    minExpertise: 'Intermediate',
    options: [
      { id: "modern-global", label: "Modern & Global", description: "The sound of today, neutral and polished." },
      { id: "80s-retro", label: "80s Retro / Neon", description: "Vintage synths and big gated drums." },
      { id: "70s-analog", label: "70s Analog / Groove", description: "Warmth, organic soul, and classic vibe." },
      { id: "futuristic-unheard", label: "Futuristic / Sci-Fi", description: "Unheard sounds from a distant time." },
      { id: "ancient-tribal", label: "Ancient / Tribal", description: "Primal rhythms and traditional instruments." },
      { id: "latin-passionate", label: "Latin / Vibrant", description: "Rhythmic, passionate, and regional flavors." },
      { id: "east-asian-zen", label: "East Asian / Zen", description: "Traditional scales and mystical vibes." },
      { id: "middle-eastern-exotic", label: "Middle Eastern / Exotic", description: "Intricate melodies and ornate scales." },
    ],
  },

  // --- Instrumentation ---
  {
    id: "ensemble",
    title: "Instrumentation Ensemble",
    question: "Which instruments should lead and support the track? Select a role for each.",
    beginnerTitle: "Who’s in the band",
    beginnerQuestion: "What instrument families should show up? Pick a mix role for each.",
    layerHint:
      "Roles mean mix priority: lead = featured up front, rhythm = groove bed, bass = low-end anchor, harmony = pads & doubles.",
    featuredOptionIds: ['synths-digital', 'drums-percussion', 'acoustic-organic', 'electric-gritty'],
    group: 'Instrumentation',
    multiSelect: true,
    hasRoles: true,
    minExpertise: 'Intermediate',
    options: [
      { id: "synths-digital", label: "Synthesizers & Digital", description: "Analog leads, digital pads, and bass synths." },
      { id: "orchestral-strings", label: "Orchestral & Strings", description: "Grand brass, woodwinds, and backing strings." },
      { id: "acoustic-organic", label: "Acoustic & Organic", description: "Guitars, piano, and intimate textures." },
      { id: "electric-gritty", label: "Electric & Gritty", description: "Distorted guitars, riffs, and raw energy." },
      { id: "drums-percussion", label: "Drums & Auxiliary Percussion", description: "The rhythmic backbone with subtle accents." },
      { id: "ambient-sub", label: "Ambient Pads & Sub-Bass", description: "Evolving backgrounds and deep low end." },
    ],
  },

  // --- Vocal Architecture ---
  {
    id: "vocal-identity",
    title: "Vocal Identity & Tone",
    question: "Define the character and delivery of the voice.",
    beginnerTitle: "Vocals",
    beginnerQuestion: "Instrumental only, or what vocal character should we aim for?",
    layerHint:
      "Choosing “Purely Instrumental” skips lyric language and story steps so the path stays short.",
    featuredOptionIds: [
      'none',
      'male-warm',
      'female-ethereal',
      'choral-harmonic',
      'processed-robotic',
      'spoken-monotone',
    ],
    group: 'Vocal Architecture',
    multiSelect: true,
    minExpertise: 'Beginner',
    options: [
      { id: "none", label: "Purely Instrumental", description: "No vocals, focus on the music." },
      { id: "male-warm", label: "Male (Warm & Resonant)", description: "Deep, comforting, or soaring male voice." },
      { id: "female-ethereal", label: "Female (Ethereal & Clear)", description: "Powerful, breathy, or angelic female voice." },
      { id: "choral-harmonic", label: "Choral & Harmonic", description: "A group of voices singing in harmony." },
      { id: "processed-robotic", label: "Processed / Robotic", description: "Vocoders, autotune, and synthetic edges." },
      { id: "gritty-aggressive", label: "Gritty & Aggressive", description: "Raspy, growled, or distorted textures." },
      { id: "theatrical-operatic", label: "Theatrical & Operatic", description: "Dramatic, trained, and larger-than-life." },
      { id: "spoken-monotone", label: "Spoken / Monotone", description: "Narrative, rhythmic, or detached speech." },
    ],
  },
  {
    id: "lyrics-language",
    title: "Lyrics Language",
    question: "In what tongue should the story be told?",
    beginnerTitle: "Lyric language",
    beginnerQuestion: "What language should the lyrics be in?",
    layerHint: "Lyria follows the language you specify here in the final prompt.",
    featuredOptionIds: ['english', 'spanish', 'french', 'japanese', 'korean', 'portuguese'],
    group: 'Vocal Architecture',
    minExpertise: 'Intermediate',
    options: [
      { id: "english", label: "English", description: "Universal and widely understood." },
      { id: "spanish", label: "Spanish", description: "Rhythmic, passionate, and vibrant." },
      { id: "french", label: "French", description: "Romantic, melodic, and poetic." },
      { id: "japanese", label: "Japanese", description: "Unique phonetics and cultural depth." },
      { id: "chinese", label: "Chinese (Mandarin)", description: "Tonal, ancient, and powerful." },
      { id: "hindi", label: "Hindi", description: "Rich in tradition and melodic flow." },
      { id: "arabic", label: "Arabic", description: "Deeply expressive and ornate." },
      { id: "portuguese", label: "Portuguese", description: "Smooth, rhythmic, and soulful." },
      { id: "german", label: "German", description: "Strong, rhythmic, and structured." },
      { id: "korean", label: "Korean", description: "Modern, rhythmic, and expressive." },
      { id: "italian", label: "Italian", description: "Lyrical, bright, and operatic." },
      { id: "latin", label: "Latin", description: "Ancient, sacred, and powerful." },
      { id: "gibberish", label: "Invented / Glossolalia", description: "Purely phonetic, emotional sounds." },
    ],
  },
  {
    id: "lyricContent",
    title: "Lyrical Content & Imagery",
    question: "Describe the story, themes, and specific imagery you want in the lyrics in detail.",
    beginnerTitle: "Lyric story & imagery",
    beginnerQuestion: "What story or images should the lyrics lean on? (Creative direction, not final lyrics.)",
    layerHint: "This is a brief to the model—not words to sing verbatim unless you write it that way.",
    group: 'Vocal Architecture',
    type: 'text',
    minExpertise: 'Beginner',
    options: [],
    presets: [
      "A lonely astronaut looking back at a dying Earth. Keywords: Neon, rain, echoes, shadows, chrome.",
      "A forbidden romance in a neon-lit cyberpunk city. Keywords: Binary, circuits, soul, ghost, interface.",
      "The feeling of waking up in a dream within a dream. Keywords: Golden hour, wheat fields, cicadas, dust.",
      "A traveler finding an ancient, forgotten civilization. Keywords: Ocean, salt, horizon, sails, deep blue.",
      "The internal struggle between logic and raw emotion. Keywords: Fire, ash, rebirth, wings, embers.",
      "A celebration of life after a long period of darkness. Keywords: Clockwork, gears, time, rust, precision."
    ]
  },
  {
    id: "lyric-style",
    title: "Lyric Style",
    question: "What is the structural and narrative approach of the lyrics?",
    beginnerTitle: "Lyric structure",
    beginnerQuestion: "How should lines be structured narratively?",
    layerHint: "Storytelling vs abstract poetry changes pacing and rhyme density.",
    group: 'Vocal Architecture',
    minExpertise: 'Advanced',
    options: [
      { id: "storytelling", label: "Storytelling", description: "A clear narrative arc with characters and events." },
      { id: "abstract-poetry", label: "Abstract Poetry", description: "Focus on metaphor, symbolism, and evocative imagery." },
      { id: "conversational", label: "Conversational", description: "Natural, informal speech as if talking to a friend." },
      { id: "declarative", label: "Declarative", description: "Strong, direct statements and bold proclamations." },
      { id: "stream-of-consciousness", label: "Stream of Consciousness", description: "Unfiltered, flowing thoughts and impressions." },
    ],
  },
  {
    id: "vocal-delivery",
    title: "Vocal Perspective & Style",
    question: "How are the words delivered and to whom?",
    beginnerTitle: "Point of view",
    beginnerQuestion: "Who is speaking, and how direct is the delivery?",
    layerHint: "First vs second person changes intimacy; rap flow changes syllable density.",
    group: 'Vocal Architecture',
    minExpertise: 'Expert',
    options: [
      { id: "first-person-literal", label: "First Person & Direct", description: "Personal, honest, and straightforward." },
      { id: "second-person-metaphor", label: "Second Person & Metaphorical", description: "Addressing 'you' with rich symbolism." },
      { id: "third-person-abstract", label: "Third Person & Abstract", description: "Narrating a surreal or non-linear story." },
      { id: "rhythmic-flow", label: "Rhythmic Flow / Rap", description: "Emphasis on cadence, rhyme, and flow." },
      { id: "minimal-haiku", label: "Minimal / Haiku-like", description: "Short, impactful, and sparse delivery." },
    ],
  },
  {
    id: "contentRating",
    title: "Content Rating",
    question: "What is the lyrical intensity and explicitness?",
    beginnerTitle: "Explicitness",
    beginnerQuestion: "How family-friendly should the lyrics be?",
    layerHint: "Sets how raw language and themes can get.",
    group: 'Vocal Architecture',
    minExpertise: 'Advanced',
    options: [
      { id: "clean", label: "Clean / All Ages", description: "Safe for everyone, no profanity." },
      { id: "mild", label: "Mild / Suggestive", description: "Some mature themes, no explicit language." },
      { id: "explicit", label: "Explicit / Raw", description: "Unfiltered expression, may include profanity." },
    ],
  },
  {
    id: "percussion-elements",
    title: "Beatbox & Percussion",
    question: "Should human percussion or unique beats be integrated?",
    beginnerTitle: "Human percussion",
    beginnerQuestion: "Any beatboxing or mouth-percussion in the track?",
    layerHint: "Adds organic transient texture on top of drum machines or live drums.",
    group: 'Vocal Architecture',
    minExpertise: 'Expert',
    options: [
      { id: "none", label: "Standard Percussion", description: "Traditional drum sounds only." },
      { id: "subtle-beatbox", label: "Subtle Beatbox Accents", description: "Human breath and clicks in the background." },
      { id: "lead-beatbox", label: "Lead Human Percussion", description: "Beatbox as the main rhythmic driver." },
      { id: "layered-hybrid", label: "Layered Hybrid Beats", description: "A blend of human and electronic percussion." },
    ],
  },

  // --- Final Mix ---
  {
    id: "composition-form",
    title: "Compositional Form",
    question: "How should the track be structured and arranged?",
    beginnerTitle: "Song form",
    beginnerQuestion: "How should sections build and repeat?",
    layerHint: "Guides whether hooks return often vs through-composed evolution.",
    group: 'Final Mix',
    minExpertise: 'Advanced',
    options: [
      { id: "verse-chorus-layered", label: "Verse-Chorus & Layered", description: "Catchy, rich, and densely organized." },
      { id: "aaba-sparse", label: "AABA & Sparse", description: "Standard form with lots of space." },
      { id: "progressive-symphonic", label: "Progressive & Symphonic", description: "Grand, evolving, and constantly building." },
      { id: "minimalist-jam", label: "Minimalist & Organic", description: "Small changes with a loose, improvisational feel." },
      { id: "cinematic-wall", label: "Cinematic Wall of Sound", description: "Epic climaxes and massive sonic textures." },
    ],
  },
  {
    id: "sonic-texture",
    title: "Sonic Texture & Dynamics",
    question: "What are the final production and dynamic characteristics?",
    beginnerTitle: "Mix texture",
    beginnerQuestion: "Overall loudness, space, and dynamics—polished vs raw?",
    layerHint: "Think loudness + reverb + saturation: ‘hifi loud’ vs ‘dynamic & roomy’.",
    group: 'Final Mix',
    minExpertise: 'Expert',
    options: [
      { id: "hifi-compressed", label: "High-Fi & Compressed", description: "Crystal clear, polished, and loud." },
      { id: "lofi-dynamic", label: "Lo-fi & Dynamic", description: "Warm, grainy, with a natural volume range." },
      { id: "reverb-faded", label: "Reverb-Heavy & Faded", description: "Spacious, dreamy, and low-intensity." },
      { id: "dry-direct", label: "Dry & Intimate", description: "Close-up, detailed, and direct." },
      { id: "distorted-peaking", label: "Gritty & Aggressive", description: "Saturated, raw, and intentionally loud." },
    ],
  },
];
