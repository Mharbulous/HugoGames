// French Grammar Impostors - Game Data Module
// All game constants and static data

const phrasePairs = [
// === VERB CONJUGATION ERRORS (Present Tense) ===
    // Focus on common irregular verbs from Grade 4
    { correct: "Je suis content aujourd'hui.", impostor: "Je être content aujourd'hui." },
    { correct: "Nous avons un chat noir.", impostor: "Nous avoir un chat noir." },
    { correct: "Elle va à l'école.", impostor: "Elle aller à l'école." },
    { correct: "Ils font leurs devoirs.", impostor: "Ils faire leurs devoirs." },
    { correct: "Tu aimes les pommes?", impostor: "Tu aimer les pommes?" },
    { correct: "Nous mangeons du pain.", impostor: "Nous manger du pain." },
    
    // === ARTICLE GENDER ERRORS ===
    // Common gender mistakes with familiar vocabulary
    { correct: "La maison est grande.", impostor: "Le maison est grande." },
    { correct: "Le chat est mignon.", impostor: "La chat est mignon." },
    { correct: "Une pomme rouge.", impostor: "Un pomme rouge." },
    { correct: "L'école est fermée.", impostor: "Le école est fermée." },
    
    // === ADJECTIVE AGREEMENT ERRORS ===
    // Simple adjective agreement patterns
    { correct: "Ma soeur est petite.", impostor: "Ma soeur est petit." },
    { correct: "Les chiens sont gentils.", impostor: "Les chiens sont gentil." },
    { correct: "Une grande famille.", impostor: "Une grand famille." },
    { correct: "Des livres intéressants.", impostor: "Des livres intéressant." },
    
    // === BANGS ADJECTIVE PLACEMENT ===
    // Adjectives that go before the noun
    { correct: "Un petit chien.", impostor: "Un chien petit." },
    { correct: "Une belle maison.", impostor: "Une maison belle." },
    { correct: "Les bonnes idées.", impostor: "Les idées bonnes." },
    { correct: "Mon nouveau livre.", impostor: "Mon livre nouveau." },
    
    // === PASSÉ COMPOSÉ FORMATION ===
    // Basic past tense with avoir (Grade 4 introduction)
    { correct: "J'ai mangé une pizza.", impostor: "J'ai manger une pizza." },
    { correct: "Elle a fini ses devoirs.", impostor: "Elle a finir ses devoirs." },
    { correct: "Nous avons joué dehors.", impostor: "Nous avons jouer dehors." },
    { correct: "Tu as regardé la télé?", impostor: "Tu as regarder la télé?" },
    
    // === BASIC PREPOSITIONS ===
    // Common preposition choices from Grade 4
    { correct: "Je vais à l'école.", impostor: "Je vais dans l'école." },
    { correct: "Le livre est sur la table.", impostor: "Le livre est dans la table." },
    { correct: "Je joue avec mes amis.", impostor: "Je joue à mes amis." },
    { correct: "Il habite dans une maison.", impostor: "Il habite à une maison." },
    
    // === SIMPLE NEGATION ===
    // Basic ne...pas structure
    { correct: "Je n'aime pas les légumes.", impostor: "Je ne aime pas les légumes." },
    { correct: "Il ne veut pas dormir.", impostor: "Il veut ne pas dormir." },
    { correct: "Nous ne sommes pas fatigués.", impostor: "Nous ne pas sommes fatigués." },
    
    // === ÊTRE vs. AVOIR ===
    // Common confusion between these two verbs
    { correct: "J'ai faim.", impostor: "Je suis faim." },
    { correct: "Il a froid.", impostor: "Il est froid." },
    { correct: "Tu as huit ans.", impostor: "Tu es huit ans." },
    { correct: "Elle a soif.", impostor: "Elle est soif." },
    
    // === PLURAL FORMS ===
    // Simple singular to plural transitions
    { correct: "Les enfants jouent.", impostor: "Les enfants joue." },
    { correct: "Mes amis sont gentils.", impostor: "Mes ami sont gentils." },
    { correct: "Des chats noirs.", impostor: "Des chat noir." },
    
    // === FUTUR PROCHE (Going to...) ===
    // Simple future with aller + infinitive
    { correct: "Je vais manger.", impostor: "Je vais mange." },
    { correct: "Elle va dormir.", impostor: "Elle va dort." },
    { correct: "Nous allons jouer.", impostor: "Nous allons jouons." }
];

const crewmateData = [
    {name: 'Rouge', color: '#D71E22'}, {name: 'Bleu', color: '#1D3CE9'},
    {name: 'Vert', color: '#1B913E'}, {name: 'Rose', color: '#FF63D4'},
    {name: 'Orange', color: '#FF8D1C'}, {name: 'Jaune', color: '#FFFF67'},
    {name: 'Noir', color: '#4A565E'}, {name: 'Blanc', color: '#E9F7FF'},
    {name: 'Violet', color: '#783DD2'}, {name: 'Marron', color: '#80582D'},
    {name: 'Cyan', color: '#44FFF7'}, {name: 'Citron', color: '#5BFE4B'},
    {name: 'Bordeaux', color: '#6C2B3D'}, {name: 'Chair', color: '#FFD6EC'},
    {name: 'Banane', color: '#FFFFBE'}
];

const violentDeathPhrases = [
    "ARGH!",
    "GLOUPS!",
    "AÏEEE!",
    "OUGH!",
    "URGH!",
    "TCHAC!"
];

const innocentEjectionPhrases = [
    "Non, pas moi!",
    "Je suis innocent!",
    "Vous vous trompez!",
    "J'espère que les aliens sont sympas!",
    "Mais j'ai fait toutes mes tâches!",
    "Vous le regretterez!",
    "Ce n'était pas moi, je vous jure!",
    "Houston, on a un problème!",
    "Eventuellement, j'ai arrêté de penser...",
    "Dites à ma famille que je les aime!",
    "C'était pas moi, je le jure!",
    "C'était un peu louche.",
    "Ce n'était pas moi :("
];

const imposterEjectionPhrases = [
    "Au moins, je vais voir les étoiles!",
    "Je reviendrai!",
    "À bientôt, astronautes!",
    "Vive la gravité zéro!",
    "J'aurais dû rester au lit!",
    "Vous avez eu de la chance cette fois!",
    "Bien joué, les terriens!",
    "L'espace, me voilà!",
    "Ma mission est accomplie!",
    "Merci pour cette partie!",
    "On se revoit dans l'espace infini!",
    "GG les amis!",
    "Eventuellement, Kars a arrêté de penser..."
];

function getRandomDeathPhrase(deathType) {
    let phrases;
    switch(deathType) {
        case 'violent':
            phrases = violentDeathPhrases;
            break;
        case 'innocent_ejected':
            phrases = innocentEjectionPhrases;
            break;
        case 'impostor_ejected':
            phrases = imposterEjectionPhrases;
            break;
        default:
            phrases = violentDeathPhrases;
    }
    return phrases[Math.floor(Math.random() * phrases.length)];
}

// ========== IMPOSTOR MODE DATA ==========

// French accent input patterns for impostor mode
const accentInputPatterns = {
    // Accent Aigu (é)
    'é': {keystroke: "'e", description: "Accent Aigu"},
    // Accent Grave (à, è, ù)
    'à': {keystroke: "`a", description: "Accent Grave"},
    'è': {keystroke: "`e", description: "Accent Grave"},
    'ù': {keystroke: "`u", description: "Accent Grave"},
    // Circumflex (â, ê, î, ô, û)
    'â': {keystroke: "^a", description: "Circumflex"},
    'ê': {keystroke: "^e", description: "Circumflex"},
    'î': {keystroke: "^i", description: "Circumflex"},
    'ô': {keystroke: "^o", description: "Circumflex"},
    'û': {keystroke: "^u", description: "Circumflex"},
    // Tréma/Umlaut (ë, ï, ü)
    'ë': {keystroke: '"e', description: "Tréma"},
    'ï': {keystroke: '"i', description: "Tréma"},
    'ü': {keystroke: '"u', description: "Tréma"},
    // Cédille (ç)
    'ç': {keystroke: "'c", description: "Cédille"}
};

// Impostor mode configuration constants
const impostorConfig = {
    totalPlayers: 12,
    impostors: 3,
    crewmates: 9,
    taskProgressTotal: 180, // seconds total across all rounds
    hugo: {
        name: 'Hugo',
        isPlayer: true
    }
};

// Helper function to process accent input
function processAccentInput(inputChar, previousChar) {
    const accentMap = {
        "'e": 'é',
        "'c": 'ç',
        '`a': 'à',
        '`e': 'è',
        '`u': 'ù',
        '^a': 'â',
        '^e': 'ê',
        '^i': 'î',
        '^o': 'ô',
        '^u': 'û',
        '"e': 'ë',
        '"i': 'ï',
        '"u': 'ü'
    };

    const combination = previousChar + inputChar;
    return accentMap[combination] || inputChar;
}