// French Grammar Impostors - Game Data Module
// All game constants and static data

const phrasePairs = [
    // Preposition errors with verbs
    { correct: "On va jouer à Minecraft ce soir.", impostor: "On va jouer Minecraft ce soir." },
    
    // Expressions with avoir vs. être
    { correct: "Tu as de la chance de venir avec nous!", impostor: "Tu es de la chance de venir avec nous!" },
    
    // Negation patterns
    { correct: "Je ne veux pas partir.", impostor: "Je ne veux pas de partir." },
    
    // Article usage after negation
    { correct: "Il n'y a pas de problème.", impostor: "Il n'y a pas un problème." },
    
    // Time expressions
    { correct: "Il est trop excité!", impostor: "Il a trop excité!" },
    
    // Prepositions with places/activities
    { correct: "On va au camp demain.", impostor: "On va à camp demain." },
    
    // Pronoun placement
    { correct: "Je l'ai vu hier.", impostor: "Je l'ai vu lui hier." },
    
    // Partitive articles
    { correct: "Tu veux de l'aide?", impostor: "Tu veux l'aide?" },
    
    // Expressions of emotion/state
    { correct: "J'ai peur des zombies.", impostor: "Je suis peur des zombies." },
    
    // Prepositions with transportation
    { correct: "Je vais en avion.", impostor: "Je vais avec l'avion." },
    
    // Chez vs. à
    { correct: "Je vais chez mon ami.", impostor: "Je vais à mon ami." },
    
    // Weather expressions
    { correct: "Il fait beau aujourd'hui!", impostor: "Il est beau aujourd'hui!" },
    
    // Article with parts of day
    { correct: "On se voit le matin.", impostor: "On se voit au matin." },
    
    // Pronoun y
    { correct: "J'y vais maintenant.", impostor: "Je vais y maintenant." },
    
    // Faire expressions
    { correct: "Tu fais quoi ce soir?", impostor: "Tu es quoi ce soir?" }
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