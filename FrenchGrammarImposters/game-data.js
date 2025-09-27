// French Grammar Impostors - Game Data Module
// All game constants and static data

const phrasePairs = [
    { correct: "Lundi, j'ai un match de soccer.", impostor: "Sur lundi, j'ai un match de soccer." },
    { correct: "J'ai regardé un film à la télévision.", impostor: "J'ai regardé un film sur la télévision." },
    { correct: "Je n'ai pas de crayon.", impostor: "Je n'ai pas un crayon." },
    { correct: "J'ai chaud. Est-ce que je peux avoir un verre d'eau?", impostor: "Je suis chaud. Est-ce que je peux avoir un verre de l'eau?" },
    { correct: "Qu'est-ce que tu fais ici? Oh, rien du tout!", impostor: "Qu'est-ce que tu fais ici? Oh, rien!" },
    { correct: "Quelle heure est-il?", impostor: "Quel temps est-il?" },
    { correct: "Je vais chez le médecin.", impostor: "Je vais au médecin." },
    { correct: "Je suis allé à Victoria.", impostor: "J'ai allé à Victoria." },
    { correct: "J'ai peur et j'ai froid.", impostor: "J'ai peur et je suis froid." },
    { correct: "Je l'aime parce qu'il est le meilleur.", impostor: "Je l'aime lui parce qu'il est le meilleur." },
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
    impostors: 5,
    crewmates: 7,
    hugoTimeLimit: 60, // seconds
    aiImpostorMinTime: 20, // seconds
    aiImpostorMaxTime: 60, // seconds
    taskProgressTotal: 180, // seconds total across all rounds
    killWindowBase: 10, // base seconds for kill opportunity
    killWindowRandom: 20, // additional random seconds
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