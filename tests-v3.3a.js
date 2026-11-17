'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = __dirname;
let passed = 0, failed = 0;
function verifier(nom, condition, detail) {
  if (condition) { passed++; return; }
  failed++;
  console.log('    ECHEC : ' + nom + (detail ? ' -> ' + detail : ''));
}

/* ---------- 1. Ids reels du DOM ---------- */
const html = fs.readFileSync(path.join(baseDir, 'src/index.html'), 'utf8');
const domIds = [];
const re = /id="(zone-[a-z0-9-]+)"/g;
let m;
while ((m = re.exec(html)) !== null) { domIds.push(m[1]); }
const uniques = Array.from(new Set(domIds)).sort();

/* ---------- 2. Stub DOM minimal ---------- */
function creerZone(id) {
  const attrs = { fill: '#FFFFFF' };
  return {
    id: id,
    style: {},
    setAttribute: function (k, v) { attrs[k] = String(v); },
    getAttribute: function (k) {
      return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null;
    },
    focus: function () {},
    addEventListener: function () {}
  };
}
function creerSvg(ids) {
  const zones = {};
  ids.forEach(function (id) { zones[id] = creerZone(id); });
  return {
    zones: zones,
    querySelector: function (sel) {
      if (!sel || sel.charAt(0) !== '#') return null;
      return zones[sel.slice(1)] || null;
    }
  };
}

const svgModele = creerSvg(uniques);
const svgPrincipal = creerSvg(uniques);
const overlay = creerZone('celebration-overlay');
const btnFermer = creerZone('btn-fermer');
const btnRecommencer = creerZone('btn-recommencer');

const listeners = {};
const doc = {
  querySelector: function (sel) {
    if (sel === '.svg-modele') return svgModele;
    if (sel === '.svg-principal') return svgPrincipal;
    return null;
  },
  getElementById: function (id) {
    if (id === 'celebration-overlay') return overlay;
    if (id === 'btn-fermer') return btnFermer;
    if (id === 'btn-recommencer') return btnRecommencer;
    return null;
  },
  addEventListener: function (t, cb) {
    (listeners[t] = listeners[t] || []).push(cb);
  }
};

/* ---------- 3. Un seul contexte, ordre reel de index.html ---------- */
const sandbox = { document: doc, console: console };
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
['config.js', 'drawings.js', 'modele.js', 'validation.js'].forEach(function (f) {
  const code = fs.readFileSync(path.join(baseDir, 'src/js/' + f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
});
(listeners['DOMContentLoaded'] || []).forEach(function (cb) { cb(); });

const MODELE = vm.runInContext('MODELE_CIBLE', ctx);
const clesModele = Object.keys(MODELE).sort();
const maisonExpr = "DRAWINGS.find(function (d) { return d.id === 'maison'; })";

/* ---------- 4. Oracle DOM ---------- */
console.log('[1. index.html]');
verifier('index.html expose 5 ids de zone uniques', uniques.length === 5, String(uniques.length) + ' -> ' + uniques.join(','));

console.log('[2. Oracle DOM : egalite stricte]');
verifier('cles de MODELE_CIBLE == ids DOM',
  JSON.stringify(clesModele) === JSON.stringify(uniques),
  'modele=[' + clesModele.join(',') + '] dom=[' + uniques.join(',') + ']');

/* ---------- 5. Regle partagee ---------- */
console.log('[3. Regle domIdFor]');
const rMur = vm.runInContext('domIdFor(' + maisonExpr + ", 'mur')", ctx);
const rToit = vm.runInContext('domIdFor(' + maisonExpr + ", 'toit')", ctx);
verifier("domIdFor(maison,'mur') == zone-murs", rMur === 'zone-murs', String(rMur));
verifier("domIdFor(maison,'toit') == zone-toit", rToit === 'zone-toit', String(rToit));

console.log('[4. renderDrawing]');
const svg = vm.runInContext('renderDrawing(' + maisonExpr + ', { model: true })', ctx);
const idsAttendus = vm.runInContext('(' + maisonExpr + ').zones.map(function (z) { return domIdFor(' + maisonExpr + ', z.id); })', ctx);
const manquants = [];
for (let i = 0; i < idsAttendus.length; i++) {
  if (svg.indexOf('id="' + idsAttendus[i] + '"') === -1) { manquants.push(idsAttendus[i]); }
}
verifier('renderDrawing emet les 5 ids DOM reels', manquants.length === 0, manquants.join(','));

/* ---------- 6. Miniature ---------- */
console.log('[5. Miniature]');
const peintes = uniques.filter(function (id) {
  const f = svgModele.zones[id].getAttribute('fill');
  return f && String(f).toUpperCase() === String(MODELE[id]).toUpperCase();
});
verifier('miniature : 5/5 zones a la couleur cible', peintes.length === 5, peintes.length + '/5');
const blanches = uniques.filter(function (id) {
  return String(svgModele.zones[id].getAttribute('fill')).toUpperCase() === '#FFFFFF';
});
verifier('miniature : aucune zone restee blanche', blanches.length === 0, blanches.join(','));

/* ---------- 7. Jouabilite reelle ---------- */
console.log('[6. Jouabilite]');
const clesModeleListe = Object.keys(MODELE);
const sansZone = clesModeleListe.filter(function (id) { return !svgPrincipal.zones[id]; });
verifier('chaque cle du modele a une zone dans .svg-principal', sansZone.length === 0, sansZone.join(','));
clesModeleListe.forEach(function (id) {
  if (svgPrincipal.zones[id]) {
    svgPrincipal.zones[id].setAttribute('fill', MODELE[id].toUpperCase());
  }
});
vm.runInContext('verifierDessin()', ctx);
verifier('coloriage parfait -> celebration ouverte', overlay.style.display === 'flex', String(overlay.style.display));

console.log('[7. Controle negatif]');
vm.runInContext('recommencerDessin()', ctx);
clesModeleListe.forEach(function (id, i) {
  if (i === 0) { return; }
  if (svgPrincipal.zones[id]) {
    svgPrincipal.zones[id].setAttribute('fill', MODELE[id].toUpperCase());
  }
});
vm.runInContext('verifierDessin()', ctx);
verifier('une zone fausse -> celebration non ouverte', overlay.style.display !== 'flex', String(overlay.style.display));

/* ---------- 8. Genericite de la regle ---------- */
console.log('[8. Genericite]');
const generique = vm.runInContext([
  '(function () {',
  '  var total = 0, doublons = 0, vides = 0;',
  '  DRAWINGS.forEach(function (d) {',
  '    var vus = {};',
  '    d.zones.forEach(function (z) {',
  '      total = total + 1;',
  '      var id = domIdFor(d, z.id);',
  '      if (!id) { vides = vides + 1; }',
  '      if (vus[id]) { doublons = doublons + 1; }',
  '      vus[id] = true;',
  '    });',
  '  });',
  '  return { dessins: DRAWINGS.length, total: total, doublons: doublons, vides: vides };',
  '})()'
].join('\n'), ctx);
verifier('12 dessins / 51 zones / ids uniques et non vides',
  generique.dessins === 12 && generique.total === 51 && generique.doublons === 0 && generique.vides === 0,
  JSON.stringify(generique));

console.log('');
console.log('RESUME : ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);