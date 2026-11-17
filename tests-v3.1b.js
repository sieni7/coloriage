'use strict';
/* ============================================================================
 * tests-v3.1b.js - contraintes semantiques, distinct, satisfaisabilite, 12 x 100
 * Usage : node tests-v3.1b.js            (charge ./src/js/drawings.js)
 *         DRAWINGS_PATH=<fichier> node tests-v3.1b.js
 * Sortie : ligne finale "RESUME : N passed, M failed", code de sortie 0 si M = 0.
 * ========================================================================== */
const path = require('path');
const chemin = path.resolve(process.env.DRAWINGS_PATH || path.join(__dirname, 'src', 'js', 'drawings.js'));
const { DRAWINGS, COLORS, mulberry32, randomizeModel, isComplete } = require(chemin);

let passed = 0, failed = 0;
function verifier(nom, condition, detail) {
  if (condition) { passed++; return; }
  failed++;
  console.log('    ECHEC : ' + nom + (detail ? '  -> ' + detail : ''));
}
function groupe(titre, fn) {
  const avant = failed;
  console.log('[' + titre + ']');
  fn();
  console.log('    ' + (failed === avant ? 'OK' : 'ECHEC'));
}

/* --------------------------- DONNEES ATTENDUES ----------------------------- */
const DISTINCT_ATTENDU = {
  maison:     [['toit', 'mur'], ['mur', 'porte'], ['mur', 'fenetre']],
  glace:      [['cone', 'boule'], ['boule', 'cerise']],
  fleur:      [['petales', 'centre'], ['petales', 'tige']],
  arbre:      [['feuillage', 'pommes'], ['feuillage', 'tronc']],
  champignon: [['chapeau', 'taches'], ['chapeau', 'pied'], ['pied', 'herbe']],
  papillon:   [['ailes-hautes', 'corps'], ['ailes-basses', 'corps'], ['ailes-hautes', 'tete'],
               ['ailes-hautes', 'ailes-basses'], ['corps', 'tete']],
  poisson:    [['corps', 'nageoire'], ['corps', 'queue'], ['corps', 'oeil']],
  tortue:     [['carapace', 'motifs'], ['carapace', 'tete'], ['carapace', 'pattes']],
  voiture:    [['carrosserie', 'cabine'], ['carrosserie', 'phare'], ['carrosserie', 'roues']],
  escargot:   [['coquille', 'spirale'], ['coquille', 'corps']],
  bateau:     [['coque', 'mer'], ['mat', 'voile-gauche'], ['mat', 'voile-droite'],
               ['voile-gauche', 'voile-droite']],
  fusee:      [['corps', 'nez'], ['corps', 'hublot'], ['corps', 'ailes'], ['corps', 'flamme']]
};

// 22 zones ajoutees par v3.1b : fixed (avec couleur) ou allowed (liste exacte)
const CONTRAINTES_ATTENDUES = {
  'maison.porte':      { allowed: ['marron', 'rouge', 'bleu', 'vert'] },
  'maison.fenetre':    { allowed: ['bleuclair', 'jaune'] },
  'glace.cerise':      { fixed: 'rouge' },
  'fleur.tige':        { fixed: 'vert' },
  'fleur.feuille':     { fixed: 'vert' },
  'arbre.tronc':       { fixed: 'marron' },
  'champignon.taches': { fixed: 'jaune' },
  'papillon.corps':    { fixed: 'marron' },
  'papillon.tete':     { fixed: 'rouge' },
  'poisson.nageoire':  { allowed: ['rouge', 'orange', 'jaune'] },
  'poisson.queue':     { allowed: ['jaune', 'orange', 'rouge'] },
  'tortue.motifs':     { allowed: ['jaune', 'orange', 'rouge'] },
  'tortue.tete':       { allowed: ['jaune', 'vert'] },
  'tortue.pattes':     { allowed: ['vert', 'marron'] },
  'voiture.phare':     { fixed: 'jaune' },
  'voiture.roues':     { fixed: 'noir' },
  'escargot.spirale':  { fixed: 'rouge' },
  'escargot.corps':    { allowed: ['vert', 'jaune', 'orange'] },
  'escargot.tete':     { allowed: ['jaune', 'vert', 'orange'] },
  'bateau.coque':      { allowed: ['marron', 'rouge', 'gris'] },
  'bateau.mat':        { fixed: 'marron' },
  'fusee.hublot':      { fixed: 'bleuclair' }
};

const SEEDS = Array.from({ length: 100 }, (_, i) => 1000 + i * 7919);
const cle = p => p.slice().sort().join('|');
const estFixe = z => z.fixed === true;

function distinctRespecte(d, model) {
  return (d.distinct || []).every(p => model[p[0]] !== model[p[1]]);
}
function nbCouleurs(m) { return new Set(Object.keys(m).map(k => m[k])).size; }

/* ------------------------------ 1. STRUCTURE ------------------------------- */
groupe('1. Structure : 12 dessins, 51 zones, toutes contraintes', () => {
  verifier('12 dessins', DRAWINGS.length === 12, String(DRAWINGS.length));
  let zones = 0, fixes = 0, autorises = 0;
  DRAWINGS.forEach(d => d.zones.forEach(z => {
    zones++;
    const f = estFixe(z), a = Array.isArray(z.allowed) && z.allowed.length > 0;
    if (f) fixes++;
    if (a) autorises++;
    verifier(d.id + '.' + z.id + ' : fixed XOR allowed', f !== a);
  }));
  verifier('51 zones', zones === 51, String(zones));
  verifier('19 fixed', fixes === 19, String(fixes));
  verifier('32 allowed', autorises === 32, String(autorises));
});

/* ------------------------ 2. LES 22 CONTRAINTES ---------------------------- */
groupe('2. Les 22 contraintes ajoutees (valeurs exactes)', () => {
  const cles = Object.keys(CONTRAINTES_ATTENDUES);
  verifier('22 contraintes attendues', cles.length === 22);
  cles.forEach(k => {
    const [did, zid] = k.split('.');
    const d = DRAWINGS.find(x => x.id === did);
    const z = d && d.zones.find(x => x.id === zid);
    verifier(k + ' : zone existante', !!z);
    if (!z) return;
    const att = CONTRAINTES_ATTENDUES[k];
    if (att.fixed) {
      verifier(k + ' : fixed true', z.fixed === true);
      verifier(k + ' : color ' + att.fixed, z.color === att.fixed, z.color);
    } else {
      verifier(k + ' : allowed ' + att.allowed.join(','), JSON.stringify(z.allowed) === JSON.stringify(att.allowed), JSON.stringify(z.allowed));
    }
  });
});

/* --------------------- 3. PALETTES ET COULEURS ----------------------------- */
groupe('3. Palettes : allowed et color inclus dans palette, palette dans COLORS', () => {
  DRAWINGS.forEach(d => {
    verifier(d.id + ' : palette sans doublon', new Set(d.palette).size === d.palette.length);
    d.palette.forEach(c => verifier(d.id + ' : palette ' + c + ' existe dans COLORS', c in COLORS));
    d.zones.forEach(z => {
      verifier(d.id + '.' + z.id + ' : color dans palette', d.palette.indexOf(z.color) >= 0, z.color);
      (z.allowed || []).forEach(c => verifier(d.id + '.' + z.id + ' : allowed ' + c + ' dans palette', d.palette.indexOf(c) >= 0));
    });
  });
  const maison = DRAWINGS.find(d => d.id === 'maison');
  verifier('palette maison contient marron', maison.palette.indexOf('marron') >= 0);
  verifier('palette maison contient bleuclair', maison.palette.indexOf('bleuclair') >= 0);
});

/* ------------------------------ 4. DISTINCT -------------------------------- */
groupe('4. Champ distinct : structure et valeurs exactes (36 paires)', () => {
  let total = 0;
  DRAWINGS.forEach(d => {
    verifier(d.id + ' : distinct est un tableau', Array.isArray(d.distinct));
    const ids = d.zones.map(z => z.id);
    const vues = new Set();
    (d.distinct || []).forEach(p => {
      total++;
      verifier(d.id + ' : paire de 2 elements', Array.isArray(p) && p.length === 2);
      verifier(d.id + ' : ' + p.join('/') + ' ids existants', ids.indexOf(p[0]) >= 0 && ids.indexOf(p[1]) >= 0);
      verifier(d.id + ' : ' + p.join('/') + ' ids differents', p[0] !== p[1]);
      verifier(d.id + ' : ' + p.join('/') + ' sans doublon', !vues.has(cle(p)));
      vues.add(cle(p));
    });
    const att = (DISTINCT_ATTENDU[d.id] || []).map(cle).sort().join(';');
    const reel = (d.distinct || []).map(cle).sort().join(';');
    verifier(d.id + ' : paires conformes au contrat', att === reel, reel);
  });
  verifier('36 paires au total', total === 36, String(total));
});

/* ------------------- 5. FIXED / FIXED IDENTIQUES --------------------------- */
groupe('5. Statique : aucune paire distinct dont les deux zones fixes ont la meme couleur', () => {
  DRAWINGS.forEach(d => (d.distinct || []).forEach(p => {
    const a = d.zones.find(z => z.id === p[0]), b = d.zones.find(z => z.id === p[1]);
    verifier(d.id + ' : ' + p.join('/') + ' fixes de meme couleur', !(estFixe(a) && estFixe(b) && a.color === b.color));
  }));
});

/* ------------------ 6. MODELE D'ORIGINE (REPLI) VALIDE --------------------- */
groupe('6. Le modele d\'origine (repli) respecte distinct', () => {
  DRAWINGS.forEach(d => {
    const o = {}; d.zones.forEach(z => { o[z.id] = z.color; });
    verifier(d.id + ' : repli valide', distinctRespecte(d, o));
    verifier(d.id + ' : repli a au moins 2 couleurs', nbCouleurs(o) >= 2);
  });
});

/* ---------------------- 7. SATISFAISABILITE EXHAUSTIVE --------------------- */
function compterSolutions(d, plafond) {
  const zones = d.zones;
  const dom = zones.map(z => estFixe(z) ? [z.color] : (z.allowed || d.palette));
  const voisins = {}; zones.forEach(z => { voisins[z.id] = []; });
  (d.distinct || []).forEach(p => { voisins[p[0]].push(p[1]); voisins[p[1]].push(p[0]); });
  let n = 0; const m = {};
  (function rec(i) {
    if (n >= plafond) return;
    if (i === zones.length) { if (nbCouleurs(m) >= 2) n++; return; }
    const z = zones[i];
    for (const c of dom[i]) {
      if (voisins[z.id].some(v => v in m && m[v] === c)) continue;
      m[z.id] = c; rec(i + 1); delete m[z.id];
    }
  })(0);
  return n;
}
groupe('7. Satisfaisabilite exhaustive (au moins 2 modeles valides par dessin)', () => {
  DRAWINGS.forEach(d => {
    const n = compterSolutions(d, 100000);
    console.log('    ' + d.id.padEnd(11) + n + (n >= 100000 ? '+' : '') + ' modeles valides');
    verifier(d.id + ' : au moins 2 modeles valides', n >= 2, 'solutions = ' + n);
  });
});

/* ---------------------- 8. REPRODUCTIBILITE 12 x 100 ----------------------- */
groupe('8. Reproductibilite : 12 dessins x 100 graines', () => {
  let n = 0, diff = 0;
  DRAWINGS.forEach(d => SEEDS.forEach(s => {
    n++;
    if (JSON.stringify(randomizeModel(d, s)) !== JSON.stringify(randomizeModel(d, s))) diff++;
  }));
  verifier(n + ' tirages doubles identiques', diff === 0, diff + ' differences');
});

/* ------------------- 9. CONFORMITE 12 x 100 (DISTINCT) --------------------- */
groupe('9. Conformite : 12 dessins x 100 graines (fixed, allowed, distinct, 2 couleurs)', () => {
  let tirages = 0, repli = 0;
  DRAWINGS.forEach(d => {
    const vus = new Set();
    let repliD = 0;
    SEEDS.forEach(s => {
      const info = {};
      const m = randomizeModel(d, s, info);
      tirages++;
      if (info.repli) { repli++; repliD++; }
      vus.add(JSON.stringify(m));
      let bon = true;
      d.zones.forEach(z => {
        const c = m[z.id];
        if (estFixe(z) && c !== z.color) bon = false;
        if (!estFixe(z) && (z.allowed || d.palette).indexOf(c) < 0) bon = false;
        if (d.palette.indexOf(c) < 0) bon = false;
      });
      if (Object.keys(m).length !== d.zones.length) bon = false;
      verifier(d.id + ' graine ' + s + ' : fixed/allowed/palette', bon);
      verifier(d.id + ' graine ' + s + ' : distinct respecte', distinctRespecte(d, m));
      verifier(d.id + ' graine ' + s + ' : au moins 2 couleurs', nbCouleurs(m) >= 2);
    });
    console.log('    ' + d.id.padEnd(11) + vus.size + ' modeles distincts sur 100, repli : ' + repliD);
    verifier(d.id + ' : variete (au moins 2 modeles distincts)', vus.size >= 2, String(vus.size));
    verifier(d.id + ' : repli <= 5 %', repliD <= 5, String(repliD));
  });
  console.log('    repli total : ' + repli + ' / ' + tirages);
  verifier('repli total < 1 % (au plus 12 sur 1200)', repli <= 12, String(repli));
});

/* ------------------------ 10. isComplete AVEC MODELE ----------------------- */
groupe('10. isComplete valide le modele aleatoire (12 x 100)', () => {
  DRAWINGS.forEach(d => SEEDS.forEach(s => {
    const m = randomizeModel(d, s);
    verifier(d.id + ' : isComplete(modele) vrai', isComplete(d, Object.assign({}, m), m) === true);
    const z = d.zones[0];
    const autre = Object.keys(COLORS).find(c => c !== m[z.id]);
    const faux = Object.assign({}, m); faux[z.id] = autre;
    verifier(d.id + ' : isComplete(zone fausse) faux', isComplete(d, faux, m) === false);
  }));
});

/* --------------------- 11. CAS SYNTHETIQUES (ROBUSTESSE) ------------------- */
groupe('11. Cas synthetiques : retrocompatibilite, distinct, insatisfiable', () => {
  // sans distinct ni fixed ni allowed (format v3.0)
  const d0 = { palette: ['rouge', 'bleu', 'vert'], zones: [{ id: 'a', color: 'rouge' }, { id: 'b', color: 'bleu' }, { id: 'c', color: 'vert' }] };
  const m0 = randomizeModel(d0, 42);
  verifier('format v3.0 : 3 zones renseignees', Object.keys(m0).length === 3);
  verifier('format v3.0 : couleurs dans la palette', Object.keys(m0).every(k => d0.palette.indexOf(m0[k]) >= 0));

  // distinct avec 2 couleurs : a et b toujours differents
  const d1 = { palette: ['rouge', 'bleu'], distinct: [['a', 'b']], zones: [{ id: 'a', color: 'rouge' }, { id: 'b', color: 'bleu' }] };
  let toujoursDiff = true;
  for (let s = 1; s <= 50; s++) { const m = randomizeModel(d1, s); if (m.a === m.b) toujoursDiff = false; }
  verifier('distinct a/b : 50 graines, toujours differents', toujoursDiff);

  // insatisfiable : repli sur le modele d'origine, sans boucle infinie ni exception
  const d2 = { palette: ['rouge'], distinct: [['a', 'b']], zones: [{ id: 'a', color: 'rouge' }, { id: 'b', color: 'rouge' }] };
  const info = {};
  const m2 = randomizeModel(d2, 7, info);
  verifier('insatisfiable : repli signale', info.repli === true);
  verifier('insatisfiable : modele d\'origine renvoye', m2.a === 'rouge' && m2.b === 'rouge');

  // zone fixe avant tout : la zone libre evite la couleur de sa voisine fixe
  const d3 = { palette: ['rouge', 'bleu', 'vert'], distinct: [['a', 'b']],
    zones: [{ id: 'b', color: 'rouge' }, { id: 'a', color: 'bleu', allowed: ['rouge', 'bleu'] }] };
  d3.zones[0].fixed = true;
  let evite = true;
  for (let s = 1; s <= 50; s++) { if (randomizeModel(d3, s).a !== 'bleu') evite = false; }
  verifier('fixe prioritaire : la voisine libre evite sa couleur', evite);
});

console.log('');
console.log('RESUME : ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
