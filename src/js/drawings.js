/* ===== Coloriage Préscolaire : bibliothèque de dessins =====
 * Chaque dessin : viewBox 400x300, zones fermées et séparées (marge >= 2 px),
 * 'color' = couleur du MODÈLE (clé de COLORS), 'palette' = couleurs proposées
 * à l'enfant (couleurs du modèle + distracteurs). Ordre des zones = ordre de dessin.
 */
const COLORS = {
  rouge:    '#ff0000',
  bleu:     '#0000ff',
  jaune:    '#ffff00',
  vert:     '#008000',
  orange:   '#ffa500',
  violet:   '#800080',
  rose:     '#ff69b4',
  marron:   '#8b4513',
  noir:     '#000000',
  gris:     '#808080',
  bleuclair:'#87ceeb'
};

/* Correspondance id de zone -> id DOM, uniquement pour le balisage statique
   historique de index.html. Sera supprimee quand v3.3b generera le SVG. */
const DOM_ID_OVERRIDES = { maison: { mur: 'zone-murs' } };
function domIdFor(d, zoneId) {
  const o = DOM_ID_OVERRIDES[d.id];
  return (o && o[zoneId]) || ('zone-' + zoneId);
}
const DRAWINGS = [
  { id: 'maison', nom: 'La maison', niveau: 1,
    palette: ['rouge','jaune','bleu','vert','orange','violet','marron','bleuclair'],
    distinct: [['toit', 'mur'], ['mur', 'porte'], ['mur', 'fenetre']],
    zones: [
      { id: 'soleil', color: 'jaune', fixed: true, el: '<circle cx="335" cy="60" r="28"/>' },
      { id: 'toit',   color: 'rouge', allowed: ['rouge','bleu','vert','orange','violet'], el: '<polygon points="105,140 200,60 295,140"/>' },
      { id: 'mur',    color: 'jaune', allowed: ['jaune','bleu','vert','orange','violet'], el: '<rect x="120" y="140" width="160" height="120"/>' },
      { id: 'porte',  color: 'bleu',  allowed: ['marron', 'rouge', 'bleu', 'vert'], el: '<rect x="140" y="190" width="40" height="70"/>' },
      { id: 'fenetre',color: 'vert',  allowed: ['bleuclair', 'jaune'], el: '<rect x="205" y="170" width="50" height="50"/>' }
    ] },

  { id: 'glace', nom: 'La glace', niveau: 1,
    palette: ['orange','rose','rouge','vert','bleu','violet','marron'],
    distinct: [['cone', 'boule'], ['boule', 'cerise']],
    zones: [
      { id: 'cone',   color: 'orange', allowed: ['orange','marron'], el: '<polygon points="150,150 250,150 200,270"/>' },
      { id: 'boule',  color: 'rose',   allowed: ['rose','rouge','vert','bleu','orange','violet'], el: '<circle cx="200" cy="100" r="50"/>' },
      { id: 'cerise', color: 'rouge',  fixed: true, el: '<circle cx="200" cy="36" r="12"/>' }
    ] },

  { id: 'fleur', nom: 'La fleur', niveau: 1,
    palette: ['rose','jaune','vert','rouge','bleu','violet','orange'],
    distinct: [['petales', 'centre'], ['petales', 'tige']],
    zones: [
      { id: 'tige',    color: 'vert',  fixed: true, el: '<rect x="195" y="190" width="10" height="80"/>' },
      { id: 'feuille', color: 'vert',  fixed: true, el: '<ellipse cx="240" cy="235" rx="30" ry="12"/>' },
      { id: 'petales', color: 'rose',  allowed: ['rose','rouge','violet','jaune','bleu','orange'], el: '<g><circle cx="200" cy="60" r="24"/><circle cx="150" cy="110" r="24"/><circle cx="250" cy="110" r="24"/><circle cx="200" cy="160" r="24"/></g>' },
      { id: 'centre',  color: 'jaune', allowed: ['jaune','orange'], el: '<circle cx="200" cy="110" r="20"/>' }
    ] },

  { id: 'arbre', nom: "L'arbre", niveau: 1,
    palette: ['vert','marron','rouge','jaune','bleu','orange'],
    distinct: [['feuillage', 'pommes'], ['feuillage', 'tronc']],
    zones: [
      { id: 'soleil',    color: 'jaune',  fixed: true, el: '<circle cx="340" cy="50" r="25"/>' },
      { id: 'feuillage', color: 'vert',   allowed: ['vert','jaune','orange','rouge'], el: '<circle cx="200" cy="100" r="65"/>' },
      { id: 'pommes',    color: 'rouge',  allowed: ['rouge','jaune'], el: '<g><circle cx="170" cy="100" r="10"/><circle cx="222" cy="82" r="10"/><circle cx="215" cy="125" r="10"/></g>' },
      { id: 'tronc',     color: 'marron', fixed: true, el: '<rect x="180" y="170" width="40" height="100"/>' }
    ] },

  { id: 'champignon', nom: 'Le champignon', niveau: 1,
    palette: ['rouge','jaune','marron','vert','bleu','orange'],
    distinct: [['chapeau', 'taches'], ['chapeau', 'pied'], ['pied', 'herbe']],
    zones: [
      { id: 'herbe',   color: 'vert',   fixed: true, el: '<rect x="60" y="268" width="280" height="20"/>' },
      { id: 'pied',    color: 'marron', fixed: true, el: '<rect x="165" y="178" width="70" height="90"/>' },
      { id: 'chapeau', color: 'rouge',  allowed: ['rouge','marron','jaune','orange'], el: '<path d="M100 170 A100 90 0 0 1 300 170 Z"/>' },
      { id: 'taches',  color: 'jaune',  fixed: true, el: '<g><circle cx="150" cy="125" r="15"/><circle cx="200" cy="100" r="15"/><circle cx="250" cy="125" r="15"/></g>' }
    ] },

  { id: 'papillon', nom: 'Le papillon', niveau: 2,
    palette: ['violet','orange','marron','rouge','jaune','bleu','rose'],
    distinct: [['ailes-hautes', 'corps'], ['ailes-basses', 'corps'], ['ailes-hautes', 'tete'], ['ailes-hautes', 'ailes-basses'], ['corps', 'tete']],
    zones: [
      { id: 'ailes-hautes', color: 'violet', allowed: ['violet','rose','rouge','bleu','orange'], el: '<g><circle cx="145" cy="110" r="45"/><circle cx="255" cy="110" r="45"/></g>' },
      { id: 'ailes-basses', color: 'orange', allowed: ['orange','rose','rouge','jaune','bleu'], el: '<g><circle cx="155" cy="195" r="30"/><circle cx="245" cy="195" r="30"/></g>' },
      { id: 'corps',        color: 'marron', fixed: true, el: '<ellipse cx="200" cy="150" rx="10" ry="55"/>' },
      { id: 'tete',         color: 'rouge',  fixed: true, el: '<circle cx="200" cy="75" r="12"/>' }
    ] },

  { id: 'poisson', nom: 'Le poisson', niveau: 2,
    palette: ['orange','jaune','rouge','noir','bleuclair','vert'],
    distinct: [['corps', 'nageoire'], ['corps', 'queue'], ['corps', 'oeil']],
    zones: [
      { id: 'bulle',     color: 'bleuclair', fixed: true, el: '<circle cx="60" cy="120" r="10"/>' },
      { id: 'nageoire',  color: 'rouge',     allowed: ['rouge', 'orange', 'jaune'], el: '<polygon points="150,100 185,65 215,100"/>' },
      { id: 'corps',     color: 'orange',    allowed: ['orange','jaune','rouge','bleuclair','vert'], el: '<ellipse cx="180" cy="150" rx="90" ry="55"/>' },
      { id: 'queue',     color: 'jaune',     allowed: ['jaune', 'orange', 'rouge'], el: '<polygon points="282,150 340,100 340,200"/>' },
      { id: 'oeil',      color: 'noir',      fixed: true, el: '<circle cx="135" cy="135" r="10"/>' }
    ] },

  { id: 'tortue', nom: 'La tortue', niveau: 2,
    palette: ['vert','jaune','orange','rouge','marron','bleu'],
    distinct: [['carapace', 'motifs'], ['carapace', 'tete'], ['carapace', 'pattes']],
    zones: [
      { id: 'carapace', color: 'vert',   allowed: ['vert','marron','jaune','orange'], el: '<path d="M110 190 A90 70 0 0 1 290 190 Z"/>' },
      { id: 'motifs',   color: 'rouge',  allowed: ['jaune', 'orange', 'rouge'], el: '<g><circle cx="160" cy="155" r="12"/><circle cx="200" cy="125" r="12"/><circle cx="240" cy="155" r="12"/></g>' },
      { id: 'tete',     color: 'jaune',  allowed: ['jaune', 'vert'], el: '<circle cx="315" cy="170" r="22"/>' },
      { id: 'pattes',   color: 'orange', allowed: ['vert', 'marron'], el: '<g><rect x="140" y="195" width="30" height="30"/><rect x="230" y="195" width="30" height="30"/></g>' }
    ] },

  { id: 'voiture', nom: 'La voiture', niveau: 2,
    palette: ['rouge','bleuclair','noir','jaune','vert','violet','bleu'],
    distinct: [['carrosserie', 'cabine'], ['carrosserie', 'phare'], ['carrosserie', 'roues']],
    zones: [
      { id: 'cabine',      color: 'bleuclair', allowed: ['bleuclair','bleu','violet'], el: '<polygon points="120,145 155,100 255,100 290,145"/>' },
      { id: 'carrosserie', color: 'rouge',     allowed: ['rouge','bleuclair','vert','violet','jaune','noir'], el: '<rect x="60" y="150" width="280" height="50"/>' },
      { id: 'phare',       color: 'jaune',     fixed: true, el: '<circle cx="325" cy="175" r="9"/>' },
      { id: 'roues',       color: 'noir',      fixed: true, el: '<g><circle cx="120" cy="228" r="26"/><circle cx="280" cy="228" r="26"/></g>' }
    ] },

  { id: 'escargot', nom: "L'escargot", niveau: 2,
    palette: ['orange','rouge','vert','jaune','bleu','violet','marron'],
    distinct: [['coquille', 'spirale'], ['coquille', 'corps']],
    zones: [
      { id: 'coquille', color: 'orange', allowed: ['orange','marron','rouge','jaune'], el: '<circle cx="170" cy="140" r="60"/>' },
      { id: 'spirale',  color: 'rouge',  fixed: true, el: '<circle cx="170" cy="140" r="30"/>' },
      { id: 'corps',    color: 'vert',   allowed: ['vert', 'jaune', 'orange'], el: '<rect x="100" y="205" width="210" height="35" rx="17"/>' },
      { id: 'tete',     color: 'jaune',  allowed: ['jaune', 'vert', 'orange'], el: '<circle cx="338" cy="195" r="20"/>' }
    ] },

  { id: 'bateau', nom: 'Le bateau', niveau: 3,
    palette: ['marron','jaune','rouge','bleu','gris','vert','orange'],
    distinct: [['coque', 'mer'], ['mat', 'voile-gauche'], ['mat', 'voile-droite'], ['voile-gauche', 'voile-droite']],
    zones: [
      { id: 'mer',          color: 'bleu',   fixed: true, el: '<rect x="20" y="255" width="360" height="30"/>' },
      { id: 'coque',        color: 'marron', allowed: ['marron', 'rouge', 'gris'], el: '<polygon points="90,200 310,200 270,250 130,250"/>' },
      { id: 'mat',          color: 'marron', fixed: true, el: '<rect x="195" y="60" width="10" height="140"/>' },
      { id: 'voile-gauche', color: 'jaune',  allowed: ['jaune','rouge','bleu','vert'], el: '<polygon points="190,90 190,185 120,185"/>' },
      { id: 'voile-droite', color: 'rouge',  allowed: ['rouge','jaune','bleu','vert'], el: '<polygon points="210,65 210,185 290,185"/>' }
    ] },

  { id: 'fusee', nom: 'La fusée', niveau: 3,
    palette: ['gris','rouge','bleu','bleuclair','orange','jaune','vert','violet'],
    distinct: [['corps', 'nez'], ['corps', 'hublot'], ['corps', 'ailes'], ['corps', 'flamme']],
    zones: [
      { id: 'nez',    color: 'rouge',     allowed: ['rouge','orange'], el: '<polygon points="170,95 200,45 230,95"/>' },
      { id: 'corps',  color: 'gris',      allowed: ['gris','bleuclair','bleu'], el: '<rect x="170" y="100" width="60" height="120"/>' },
      { id: 'hublot', color: 'bleuclair', fixed: true, el: '<circle cx="200" cy="150" r="18"/>' },
      { id: 'ailes',  color: 'bleu',      allowed: ['bleu','rouge','violet'], el: '<g><polygon points="163,185 125,245 163,225"/><polygon points="237,185 275,245 237,225"/></g>' },
      { id: 'flamme', color: 'orange',    allowed: ['orange','jaune','rouge'], el: '<polygon points="180,228 200,275 220,228"/>' }
    ] }
];

/* ===== v3.1 : generateur pseudo-aleatoire reproductible (mulberry32) ===== */
function mulberry32(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Genere un modele aleatoire reproductible.
   Retourne { zoneId: cleCouleur }.
   Regles : fixed prioritaire, puis allowed, sinon palette du dessin.
   Contrainte : au moins 2 couleurs distinctes, sinon repli sur le modele. */
function randomizeModel(d, seed, info) {
  // Modele aleatoire reproductible (v3.1b).
  // Respecte : zones fixes, listes autorisees, et paires distinct (couleurs differentes).
  // info (optionnel) : objet rempli avec { repli: booleen, essais: nombre }.
  const rng = mulberry32(seed);
  const zones = d.zones;
  const voisins = {};
  zones.forEach(z => { voisins[z.id] = []; });
  (d.distinct || []).forEach(p => {
    if (voisins[p[0]] && voisins[p[1]]) { voisins[p[0]].push(p[1]); voisins[p[1]].push(p[0]); }
  });
  const nbCouleurs = m => new Set(Object.keys(m).map(k => m[k])).size;
  const MAX_ESSAIS = 10;
  for (let essai = 1; essai <= MAX_ESSAIS; essai++) {
    const model = {};
    // 1. zones fixes en premier
    zones.forEach(z => { if (z.fixed === true) model[z.id] = z.color; });
    // 2. zones libres, dans l'ordre, en excluant les couleurs des voisines distinct
    let ok = true;
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (z.fixed === true) continue;
      const pris = voisins[z.id].map(v => model[v]);
      const choix = (z.allowed || d.palette).filter(c => pris.indexOf(c) === -1);
      if (choix.length === 0) { ok = false; break; }
      model[z.id] = choix[Math.floor(rng() * choix.length)];
    }
    // 3. contrainte de qualite : au moins 2 couleurs differentes
    if (ok && (zones.length < 2 || nbCouleurs(model) >= 2)) {
      if (info) { info.repli = false; info.essais = essai; }
      return model;
    }
  }
  // Repli : modele d'origine (couleurs de zone.color)
  if (info) { info.repli = true; info.essais = MAX_ESSAIS; }
  const origine = {};
  zones.forEach(z => { origine[z.id] = z.color; });
  return origine;
}
/* Rendu SVG.
 *  model = true  -> chaque zone prend la couleur du modèle (miniature)
 *  model = false -> zones blanches, ou couleurs posées par l'enfant via fills { zoneId: cléCouleur } */
function renderDrawing(d, { model = false, fills = {}, strokeWidth = 4 } = {}) {
  const zones = d.zones.map(z => {
    const key = model ? z.color : fills[z.id];
    const fill = key ? COLORS[key] : '#ffffff';
    return `<g id="${domIdFor(d, z.id)}" class="zone" data-zone="${z.id}" fill="${fill}" stroke="#000" ` +
           `stroke-width="${strokeWidth}" stroke-linejoin="round">${z.el}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${d.nom}">${zones}</svg>`;
}

/* Vrai si le coloriage de l'enfant correspond au modele.
   Retrocompatible : si model est omis, compare a zone.color (V1.1).
   Si model est fourni, compare a model (v3.1+ : modele aleatoire). */
function isComplete(d, fills, model) {
  if (model === undefined || model === null) {
    return d.zones.every(z => fills[z.id] === z.color);
  }
  return d.zones.every(z => fills[z.id] === model[z.id]);
}

if (typeof window !== 'undefined') Object.assign(window, { COLORS, DRAWINGS, renderDrawing, isComplete, mulberry32, randomizeModel, domIdFor });
if (typeof module !== 'undefined') module.exports = { COLORS, DRAWINGS, renderDrawing, isComplete, mulberry32, randomizeModel, domIdFor };
