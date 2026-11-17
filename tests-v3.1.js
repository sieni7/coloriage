// tests-v3.1.js - Tests unitaires v3.1 (socle v3.0 + modele aleatoire)
const { COLORS, DRAWINGS, renderDrawing, isComplete, mulberry32, randomizeModel } = require('./src/js/drawings.js');

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK    ' + msg); }
  else { failed++; console.log('  ECHEC ' + msg); }
}
function section(t) { console.log('\n[' + t + ']'); }

section('TEST 1 - mulberry32 reproductible');
{
  const a = mulberry32(12345), b = mulberry32(12345);
  let same = true, inRange = true;
  for (let i = 0; i < 100; i++) {
    const x = a(), y = b();
    if (x !== y) same = false;
    if (!(x >= 0 && x < 1)) inRange = false;
  }
  assert(same, 'meme graine = meme sequence sur 100 appels');
  assert(inRange, 'valeurs dans [0, 1)');
  const c = mulberry32(12345), d = mulberry32(54321);
  let diff = false;
  for (let i = 0; i < 10; i++) { if (c() !== d()) { diff = true; break; } }
  assert(diff, 'graines differentes = sequences differentes');
}

section('TEST 2 - randomizeModel reproductible (12 dessins)');
{
  let ok = true;
  for (const dr of DRAWINGS) {
    const m1 = randomizeModel(dr, 42);
    const m2 = randomizeModel(dr, 42);
    if (JSON.stringify(m1) !== JSON.stringify(m2)) { ok = false; console.log('    ' + dr.id); }
  }
  assert(ok, 'meme graine = meme modele pour les 12 dessins');
}

section('TEST 3 - variabilite effective');
{
  const models = new Set();
  for (let s = 0; s < 30; s++) models.add(JSON.stringify(randomizeModel(DRAWINGS[0], s)));
  assert(models.size >= 3, 'maison : au moins 3 modeles distincts sur 30 graines (' + models.size + ')');
  let figes = [];
  for (const d of DRAWINGS) {
    const set = new Set();
    for (let s = 0; s < 30; s++) set.add(JSON.stringify(randomizeModel(d, s)));
    if (set.size < 2) figes.push(d.id);
  }
  assert(figes.length === 0, 'chaque dessin varie sur 30 graines' + (figes.length ? ' : ' + figes.join(',') : ''));
}

section('TEST 4 - zones fixed');
{
  let total = 0, ok = true, detail = '';
  for (const d of DRAWINGS) {
    for (const z of d.zones) {
      if (z.fixed !== true) continue;
      total++;
      for (let s = 0; s < 50; s++) {
        const m = randomizeModel(d, s);
        if (m[z.id] !== z.color) { ok = false; detail = d.id + '.' + z.id + ' seed=' + s; break; }
      }
    }
  }
  assert(total === 19, '19 zones fixed (' + total + ')');
  assert(ok, 'couleur fixe respectee sur 50 graines' + (detail ? ' -> ' + detail : ''));
}

section('TEST 5 - zones allowed');
{
  let total = 0, ok = true, detail = '';
  for (const d of DRAWINGS) {
    for (const z of d.zones) {
      if (!Array.isArray(z.allowed) || z.allowed.length === 0) continue;
      total++;
      for (let s = 0; s < 100; s++) {
        const m = randomizeModel(d, s);
        if (!z.allowed.includes(m[z.id])) { ok = false; detail = d.id + '.' + z.id + ' seed=' + s + ' -> ' + m[z.id]; break; }
      }
    }
  }
  assert(total === 32, '32 zones allowed (' + total + ')');
  assert(ok, 'tirage toujours dans allowed sur 100 graines' + (detail ? ' -> ' + detail : ''));
}

section('TEST 6 - table de contraintes figee');
{
  const SPEC = {
    maison:    { soleil: { fixed: true }, toit: { allowed: ['rouge','bleu','vert','orange','violet'] }, mur: { allowed: ['jaune','bleu','vert','orange','violet'] } },
    glace:     { boule: { allowed: ['rose','rouge','vert','bleu','orange','violet'] }, cone: { allowed: ['orange','marron'] } },
    fleur:     { petales: { allowed: ['rose','rouge','violet','jaune','bleu','orange'] }, centre: { allowed: ['jaune','orange'] } },
    arbre:     { soleil: { fixed: true }, feuillage: { allowed: ['vert','jaune','orange','rouge'] }, pommes: { allowed: ['rouge','jaune'] } },
    champignon:{ herbe: { fixed: true }, pied: { fixed: true }, chapeau: { allowed: ['rouge','marron','jaune','orange'] } },
    papillon:  { 'ailes-hautes': { allowed: ['violet','rose','rouge','bleu','orange'] }, 'ailes-basses': { allowed: ['orange','rose','rouge','jaune','bleu'] } },
    poisson:   { bulle: { fixed: true }, oeil: { fixed: true }, corps: { allowed: ['orange','jaune','rouge','bleuclair','vert'] } },
    tortue:    { carapace: { allowed: ['vert','marron','jaune','orange'] } },
    voiture:   { carrosserie: { allowed: ['rouge','bleuclair','vert','violet','jaune','noir'] }, cabine: { allowed: ['bleuclair','bleu','violet'] } },
    escargot:  { coquille: { allowed: ['orange','marron','rouge','jaune'] } },
    bateau:    { mer: { fixed: true }, 'voile-gauche': { allowed: ['jaune','rouge','bleu','vert'] }, 'voile-droite': { allowed: ['rouge','jaune','bleu','vert'] } },
    fusee:     { corps: { allowed: ['gris','bleuclair','bleu'] }, nez: { allowed: ['rouge','orange'] }, ailes: { allowed: ['bleu','rouge','violet'] }, flamme: { allowed: ['orange','jaune','rouge'] } }
  };
  let ok = true, zonesControlees = 0;
  for (const dessinId of Object.keys(SPEC)) {
    const d = DRAWINGS.find(x => x.id === dessinId);
    if (!d) { ok = false; console.log('    dessin absent : ' + dessinId); continue; }
    for (const zid of Object.keys(SPEC[dessinId])) {
      const z = d.zones.find(x => x.id === zid);
      if (!z) { ok = false; console.log('    zone absente : ' + dessinId + '.' + zid); continue; }
      zonesControlees++;
      const att = SPEC[dessinId][zid];
      if (att.fixed && z.fixed !== true) { ok = false; console.log('    fixed manquant : ' + dessinId + '.' + zid); }
      if (att.allowed) {
        if (!Array.isArray(z.allowed)) { ok = false; console.log('    allowed manquant : ' + dessinId + '.' + zid); }
        else if (att.allowed.join(',') !== z.allowed.join(',')) { ok = false; console.log('    allowed different : ' + dessinId + '.' + zid); }
      }
    }
  }
  assert(zonesControlees === 29, '29 zones decrites dans la spec (' + zonesControlees + ')');
  assert(ok, 'les 29 zones portent exactement les contraintes attendues');
}

section('TEST 7 - allowed inclus dans palette');
{
  let ok = true, violations = 0;
  for (const d of DRAWINGS) {
    for (const z of d.zones) {
      if (!Array.isArray(z.allowed)) continue;
      for (const c of z.allowed) {
        if (!d.palette.includes(c)) { ok = false; violations++; console.log('    ' + d.id + '.' + z.id + ' : ' + c + ' absent de palette'); }
      }
    }
  }
  assert(ok, 'toutes les couleurs allowed existent dans la palette (' + violations + ' violation(s))');
  let okPal = true;
  for (const d of DRAWINGS) {
    for (const c of d.palette) { if (!COLORS[c]) { okPal = false; console.log('    ' + d.id + ' : palette invalide ' + c); } }
  }
  assert(okPal, 'toutes les entrees de palette sont des cles de COLORS');
}

section('TEST 8 - modele exhaustif et valide');
{
  let ok = true, n = 0;
  for (const d of DRAWINGS) {
    for (let s = 0; s < 100; s++) {
      const m = randomizeModel(d, s);
      n++;
      if (Object.keys(m).length !== d.zones.length) { ok = false; console.log('    ' + d.id + ' seed=' + s + ' : ' + Object.keys(m).length + ' zones'); }
      for (const z of d.zones) {
        if (!m[z.id]) { ok = false; console.log('    ' + d.id + '.' + z.id + ' seed=' + s + ' : manquant'); }
        else if (!COLORS[m[z.id]]) { ok = false; console.log('    ' + d.id + '.' + z.id + ' seed=' + s + ' : ' + m[z.id]); }
      }
    }
  }
  assert(ok, '12 dessins x 100 graines : ' + n + ' modeles exhaustifs et valides');
}

section('TEST 9 - au moins 2 couleurs');
{
  let ok = true, detail = '';
  for (const d of DRAWINGS) {
    for (let s = 0; s < 100; s++) {
      const m = randomizeModel(d, s);
      if (new Set(Object.values(m)).size < 2) { ok = false; detail = d.id + ' seed=' + s; break; }
    }
  }
  assert(ok, '12 dessins x 100 graines : au moins 2 couleurs distinctes' + (detail ? ' -> ' + detail : ''));
}

section('TEST 10 - reproductibilite 12 x 100');
{
  let ok = true, detail = '';
  for (const d of DRAWINGS) {
    for (let s = 0; s < 100; s++) {
      if (JSON.stringify(randomizeModel(d, s)) !== JSON.stringify(randomizeModel(d, s))) { ok = false; detail = d.id + ' seed=' + s; break; }
    }
  }
  assert(ok, '1200 modeles regeneres a l identique' + (detail ? ' -> ' + detail : ''));
}

section('TEST 11 - isComplete avec modele');
{
  const d = { zones: [{ id: 'a' }, { id: 'b' }] };
  const model = { a: 'rouge', b: 'bleu' };
  assert(isComplete(d, { a: 'rouge', b: 'bleu' }, model) === true, 'fills == model -> true');
  assert(isComplete(d, { a: 'rouge', b: 'vert' }, model) === false, 'fills != model -> false');
  assert(isComplete(d, { a: 'rouge' }, model) === false, 'fills partiel -> false');
  const maison = DRAWINGS[0];
  const m = randomizeModel(maison, 7);
  assert(isComplete(maison, m, m) === true, 'modele aleatoire : se colorier a l identique suffit');
  const faux = Object.assign({}, m);
  faux[maison.zones[1].id] = 'noir';
  assert(isComplete(maison, faux, m) === false, 'une zone differente -> false');
}

section('TEST 12 - isComplete sans modele (retrocompatibilite)');
{
  const d = { zones: [{ id: 'a', color: 'rouge' }, { id: 'b', color: 'bleu' }] };
  assert(isComplete(d, { a: 'rouge', b: 'bleu' }) === true, 'V1.1 complet -> true');
  assert(isComplete(d, { a: 'rouge', b: 'vert' }) === false, 'V1.1 incomplet -> false');
  const maison = DRAWINGS[0];
  const statique = {};
  for (const z of maison.zones) statique[z.id] = z.color;
  assert(isComplete(maison, statique) === true, 'maison : modele statique complet -> true');
}

section('TEST 13 - renderDrawing');
{
  const d = DRAWINGS[0];
  const a = renderDrawing(d, { model: true });
  const b = renderDrawing(d, { model: true });
  assert(a === b, 'deterministe');
  assert(a.indexOf('<svg') === 0, 'commence par <svg');
  assert(a.indexOf('viewBox="0 0 400 300"') !== -1, 'viewBox 400x300');
  let toutes = true;
  for (const z of d.zones) { if (a.indexOf('data-zone="' + z.id + '"') === -1) toutes = false; }
  assert(toutes, 'chaque zone porte data-zone');
  assert(a.indexOf(COLORS[d.zones[0].color].toLowerCase()) !== -1 || a.indexOf(COLORS[d.zones[0].color]) !== -1, 'couleur du modele appliquee');
  const blanc = renderDrawing(d, { model: false });
  assert(blanc.indexOf('#ffffff') !== -1, 'mode libre : zones blanches');
  const fills = {};
  for (const z of d.zones) fills[z.id] = 'rouge';
  assert(renderDrawing(d, { fills }).indexOf(COLORS.rouge) !== -1, 'mode libre : couleurs issues de fills');
}

section('TEST 14 - randomizeModel ne mute pas les donnees');
{
  const avant = JSON.stringify(DRAWINGS);
  for (const d of DRAWINGS) { for (let s = 0; s < 20; s++) randomizeModel(d, s); }
  assert(JSON.stringify(DRAWINGS) === avant, 'DRAWINGS inchange apres 240 generations');
  const d = DRAWINGS[0];
  const m = randomizeModel(d, 3);
  m[d.zones[0].id] = 'noir';
  assert(randomizeModel(d, 3)[d.zones[0].id] !== 'noir', 'un modele retourne est independant des suivants');
}

console.log('\n========================================');
console.log('RESUME : ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');
process.exit(failed > 0 ? 1 : 0);