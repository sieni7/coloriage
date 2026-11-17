// tests-v3.3b.js - Tests d'integration v3.3b (SVG genere, selecteur, graine injectable)
// Un seul contexte vm : window === global, comme dans le navigateur.
// DOM minimal mais reel : innerHTML est analyse, querySelector/getAttribute fonctionnent.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0, failed = 0;
function assert(cond, msg, detail) {
  if (cond) { passed++; console.log('  OK    ' + msg); }
  else { failed++; console.log('  ECHEC ' + msg + (detail ? ' -> ' + detail : '')); }
}
function section(t) { console.log('\n[' + t + ']'); }

const baseDir = path.resolve(__dirname);
const lire = f => fs.readFileSync(path.join(baseDir, f), 'utf8');

/* ------------------------------------------------------------------ */
/* DOM minimal : arbre, attributs, innerHTML analyse, selecteurs CSS   */
/* ------------------------------------------------------------------ */
function correspond(noeud, sel) {
  if (!sel) return false;
  if (sel.charAt(0) === '#') return noeud.attrs.id === sel.slice(1);
  if (sel.charAt(0) === '.') {
    const classes = (noeud.attrs.class || '').split(/\s+/);
    return sel.slice(1).split('.').every(c => classes.indexOf(c) >= 0);
  }
  return noeud.tagName === sel;
}

function parcourir(noeud, cb) {
  for (const enfant of noeud.children) { cb(enfant); parcourir(enfant, cb); }
}

function analyserAttributs(txt) {
  const attrs = {};
  const re = /([A-Za-z_][\w:.-]*)(?:\s*=\s*"([^"]*)")?/g;
  let m;
  while ((m = re.exec(txt))) { attrs[m[1]] = (m[2] === undefined) ? '' : m[2]; }
  return attrs;
}

function creerNoeud(tag, attrs) {
  const noeud = {
    tagName: tag,
    attrs: attrs || {},
    children: [],
    parentNode: null,
    style: {},
    _listeners: {},
    _html: '',
    getAttribute(n) {
      return Object.prototype.hasOwnProperty.call(this.attrs, n) ? this.attrs[n] : null;
    },
    setAttribute(n, v) { this.attrs[n] = String(v); },
    hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n); },
    addEventListener(evt, cb) { (this._listeners[evt] = this._listeners[evt] || []).push(cb); },
    removeEventListener(evt, cb) {
      const l = this._listeners[evt];
      if (!l) return;
      const i = l.indexOf(cb);
      if (i >= 0) l.splice(i, 1);
    },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    focus() {},
    closest(sel) {
      let n = this;
      while (n) { if (correspond(n, sel)) return n; n = n.parentNode; }
      return null;
    },
    querySelector(sel) {
      const r = this.querySelectorAll(sel);
      return r.length ? r[0] : null;
    },
    querySelectorAll(sel) {
      const out = [];
      parcourir(this, n => { if (correspond(n, sel)) out.push(n); });
      return out;
    }
  };

  Object.defineProperty(noeud, 'className', {
    get() { return this.attrs.class || ''; },
    set(valeur) { this.attrs.class = String(valeur); }
  });

  Object.defineProperty(noeud, 'classList', {
    get() {
      const self = this;
      return {
        contains(c) { return (self.attrs.class || '').split(/\s+/).indexOf(c) >= 0; },
        add(c) {
          const l = (self.attrs.class || '').split(/\s+/).filter(Boolean);
          if (l.indexOf(c) < 0) l.push(c);
          self.attrs.class = l.join(' ');
        },
        remove(c) {
          const l = (self.attrs.class || '').split(/\s+/).filter(x => x && x !== c);
          self.attrs.class = l.join(' ');
        }
      };
    }
  });

  Object.defineProperty(noeud, 'innerHTML', {
    get() { return this._html; },
    set(valeur) {
      this._html = String(valeur);
      this.children = [];
      const racines = analyserFragment(this._html);
      racines.forEach(r => this.appendChild(r));
    }
  });

  return noeud;
}

function analyserFragment(html) {
  const racines = [];
  const pile = [];
  const re = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[A-Za-z_][\w:.-]*(?:\s*=\s*"[^"]*")?)*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    const fermeture = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (fermeture) { if (pile.length) pile.pop(); continue; }
    const noeud = creerNoeud(tag, analyserAttributs(m[3] || ''));
    if (pile.length) pile[pile.length - 1].appendChild(noeud);
    else racines.push(noeud);
    if (m[4] !== '/') pile.push(noeud);
  }
  return racines;
}

const elements = {};
function creerElement(id, tag, attrs, style) {
  const n = creerNoeud(tag, Object.assign({ id: id }, attrs || {}));
  n.style = style || {};
  elements[id] = n;
  return n;
}

const overlay = creerElement('celebration-overlay', 'div',
  { 'class': 'celebration-overlay', 'aria-hidden': 'true' }, { display: 'none' });
creerElement('btn-fermer', 'button', { 'class': 'btn-fermer' });
creerElement('btn-recommencer', 'button', { 'class': 'btn-recommencer' });
creerElement('miniature-container', 'div', { 'class': 'svg-modele' });
creerElement('selector-container', 'div', { 'class': 'selector-container' });
creerElement('principal-container', 'div', { 'class': 'svg-principal' });

const ecouteursDocument = [];
const documentStub = {
  getElementById(id) { return elements[id] || null; },
  querySelector(sel) {
    for (const id of Object.keys(elements)) {
      const n = elements[id];
      if (correspond(n, sel)) return n;
      const trouve = n.querySelector(sel);
      if (trouve) return trouve;
    }
    return null;
  },
  querySelectorAll(sel) {
    const out = [];
    for (const id of Object.keys(elements)) {
      const n = elements[id];
      if (correspond(n, sel)) out.push(n);
      n.querySelectorAll(sel).forEach(x => out.push(x));
    }
    return out;
  },
  createElement(tag) { return creerNoeud(String(tag).toLowerCase(), {}); },
  addEventListener(evt, cb) { if (evt === 'DOMContentLoaded') ecouteursDocument.push(cb); }
};

/* ------------------------------------------------------------------ */
/* Contexte unique, window === global                                  */
/* ------------------------------------------------------------------ */
const sandbox = { console, module: { exports: {} }, exports: {}, require, document: documentStub };
sandbox.window = sandbox;
vm.createContext(sandbox);

['src/js/state.js', 'src/js/config.js', 'src/js/drawings.js', 'src/js/drawing.js',
 'src/js/selector.js', 'src/js/modele.js', 'src/js/validation.js'].forEach(f => {
  vm.runInContext(lire(f), sandbox, { filename: f });
});

const DRAWINGS = vm.runInContext('DRAWINGS', sandbox);
const COLORS = vm.runInContext('COLORS', sandbox);

// Graine injectee AVANT le premier rendu : deterministe sans toucher a Date.
sandbox.currentDrawingId = 'maison';
sandbox.currentSeed = 42;
ecouteursDocument.forEach(cb => cb());

const modele = vm.runInContext('MODELE_CIBLE', sandbox);
const dessin = DRAWINGS.find(d => d.id === 'maison');
const svgPrincipal = elements['principal-container'].querySelector('svg');
const svgMini = elements['miniature-container'].querySelector('svg');

/* ------------------------------------------------------------------ */
section('1. Suppression de DOM_ID_OVERRIDES et de domIdFor');
{
  const src = lire('src/js/drawings.js');
  assert(src.indexOf('DOM_ID_OVERRIDES') < 0, 'DOM_ID_OVERRIDES absent de drawings.js');
  assert(src.indexOf('domIdFor') < 0, 'domIdFor absent de drawings.js');
  assert(src.indexOf('class="zone zone-coloriable"') >= 0, 'renderDrawing emet class="zone zone-coloriable"');
}

section('2. Oracle DOM : zone-mur genere, zone-murs disparu');
{
  const html = elements['principal-container'].innerHTML;
  assert(html.indexOf('id="zone-mur"') >= 0, 'le SVG principal contient id="zone-mur"');
  assert(html.indexOf('id="zone-murs"') < 0, 'aucun id="zone-murs" residuel');
  assert(svgPrincipal !== null, 'un <svg> est genere dans .svg-principal');
  assert(elements['principal-container'].classList.contains('svg-principal'),
    'le conteneur porte la classe .svg-principal exigee par validation.js');
}

section('3. MODELE_CIBLE : 5 cles zone-{id}');
{
  const cles = Object.keys(modele).sort();
  const attendues = dessin.zones.map(z => 'zone-' + z.id).sort();
  assert(JSON.stringify(cles) === JSON.stringify(attendues),
    'cles == zone-{id} des zones du dessin', 'modele=[' + cles + '] attendu=[' + attendues + ']');
  assert(cles.indexOf('zone-mur') >= 0, 'zone-mur present dans MODELE_CIBLE');
  assert(cles.length === 5, 'MODELE_CIBLE contient 5 cles');
}

section('4. Miniature : 5/5 zones peintes comme le modele');
{
  const zonesMini = svgMini.querySelectorAll('.zone-coloriable');
  assert(zonesMini.length === 5, 'la miniature contient 5 zones coloriables', String(zonesMini.length));
  let ok = true, detail = '';
  Object.keys(modele).forEach(id => {
    if (!ok) return;
    const z = svgMini.querySelector('#' + id);
    if (!z) { ok = false; detail = id + ' introuvable'; return; }
    const vu = (z.getAttribute('fill') || '').toUpperCase();
    if (vu !== modele[id].toUpperCase()) { ok = false; detail = id + ' = ' + vu + ' au lieu de ' + modele[id]; }
  });
  assert(ok, 'chaque zone de la miniature porte la couleur cible', detail);
  assert(COLORS[dessin.zones[0].color] === modele['zone-soleil'].toLowerCase() ||
    COLORS[dessin.zones[0].color].toUpperCase() === modele['zone-soleil'].toUpperCase(),
    'zone-soleil (fixe, jaune) correspond a COLORS.jaune');
  let nonBlanches = 0;
  zonesMini.forEach(z => { if ((z.getAttribute('fill') || '').toUpperCase() !== '#FFFFFF') nonBlanches++; });
  assert(nonBlanches === 5, 'aucune zone blanche dans la miniature', nonBlanches + '/5');
}

section('5. Principal : blanc au depart, memes ids que la miniature');
{
  const zonesPrincipal = svgPrincipal.querySelectorAll('.zone-coloriable');
  assert(zonesPrincipal.length === 5, 'le principal contient 5 zones coloriables', String(zonesPrincipal.length));
  assert(zonesPrincipal.every(z => (z.getAttribute('fill') || '').toUpperCase() === '#FFFFFF'),
    'toutes les zones du principal sont blanches au depart');
  assert(zonesPrincipal.every(z => z.classList.contains('zone')), 'chaque zone porte aussi class="zone"');
  const idsPrincipal = zonesPrincipal.map(z => z.getAttribute('id'));
  const idsMini = svgMini.querySelectorAll('.zone-coloriable').map(z => z.getAttribute('id'));
  assert(JSON.stringify(idsPrincipal) === JSON.stringify(idsMini),
    'miniature et principal ont les memes ids dans le meme ordre',
    'principal=[' + idsPrincipal + '] miniature=[' + idsMini + ']');
}

section('6. Clic sur un enfant du <g> : closest remonte au groupe');
{
  const zoneSoleil = svgPrincipal.querySelector('#zone-soleil');
  const enfant = zoneSoleil.children[0];
  const clics = elements['principal-container']._listeners.click || [];
  assert(clics.length === 1, 'drawing.js a pose un ecouteur sur .svg-principal', String(clics.length));
  clics[0]({ target: enfant });
  assert((zoneSoleil.getAttribute('fill') || '').toUpperCase() === '#FF0000',
    'un clic sur le <circle> colore le <g> parent avec AppState.activeColor',
    zoneSoleil.getAttribute('fill'));
  assert(enfant.getAttribute('fill') === null, 'l enfant lui-meme n est pas colore (fill herite du groupe)');
}

section('7. Celebration reelle (verifierDessin)');
{
  Object.keys(modele).forEach(id => {
    svgPrincipal.querySelector('#' + id).setAttribute('fill', modele[id]);
  });
  vm.runInContext('verifierDessin()', sandbox);
  assert(vm.runInContext('celebrationVue', sandbox) === true, '5/5 correctes : celebrationVue passe a true');
  assert(overlay.style.display === 'flex', '5/5 correctes : overlay affiche en flex', overlay.style.display);
  assert(overlay.getAttribute('aria-hidden') === 'false', '5/5 correctes : aria-hidden=false');
}

section('8. Recommencer : remise a blanc et fermeture');
{
  vm.runInContext('recommencerDessin()', sandbox);
  const zones = svgPrincipal.querySelectorAll('.zone-coloriable');
  assert(zones.every(z => (z.getAttribute('fill') || '').toUpperCase() === '#FFFFFF'),
    'recommencerDessin remet les 5 zones a #FFFFFF');
  assert(overlay.style.display === 'none', 'recommencerDessin ferme l overlay', overlay.style.display);
  assert(overlay.getAttribute('aria-hidden') === 'true', 'recommencerDessin remet aria-hidden=true');
  assert(vm.runInContext('celebrationVue', sandbox) === false, 'recommencerDessin remet celebrationVue a false');
}

section('9. Controle negatif : une seule zone fausse');
{
  const cles = Object.keys(modele);
  cles.forEach(id => {
    svgPrincipal.querySelector('#' + id).setAttribute('fill', modele[id]);
  });
  const derniere = cles[cles.length - 1];
  svgPrincipal.querySelector('#' + derniere).setAttribute('fill', '#123456');
  vm.runInContext('verifierDessin()', sandbox);
  assert(vm.runInContext('celebrationVue', sandbox) === false, 'une zone fausse : celebrationVue reste false');
  assert(overlay.style.display === 'none', 'une zone fausse : la celebration ne s ouvre pas', overlay.style.display);
  // Retour au bon coloriage : la celebration doit pouvoir s ouvrir de nouveau.
  svgPrincipal.querySelector('#' + derniere).setAttribute('fill', modele[derniere]);
  vm.runInContext('verifierDessin()', sandbox);
  assert(vm.runInContext('celebrationVue', sandbox) === true, 'correction de la zone : celebration rouverte');
  assert(overlay.style.display === 'flex', 'correction de la zone : overlay de nouveau en flex');
  vm.runInContext('recommencerDessin()', sandbox);
}

section('10. Selecteur : 12 vignettes et changement de dessin');
{
  const boutons = elements['selector-container'].querySelectorAll('.selector-btn');
  assert(boutons.length === 12, 'le selecteur contient 12 boutons', String(boutons.length));
  assert(boutons[0].innerHTML.indexOf('id="zone-soleil"') >= 0,
    'la vignette de la maison utilise le meme schema id="zone-{id}"');
  const idx = DRAWINGS.findIndex(d => d.id === 'papillon');
  assert(idx >= 0 && boutons[idx].getAttribute('aria-label') === 'Choisir le dessin : Le papillon',
    'le bouton papillon porte le bon aria-label');
  const clicsBtn = boutons[idx]._listeners.click || [];
  assert(clicsBtn.length === 1, 'le bouton papillon a un ecouteur de clic');
  clicsBtn[0]();

  const modelePap = vm.runInContext('MODELE_CIBLE', sandbox);
  const attendues = DRAWINGS[idx].zones.map(z => 'zone-' + z.id).sort();
  assert(JSON.stringify(Object.keys(modelePap).sort()) === JSON.stringify(attendues),
    'papillon : MODELE_CIBLE suit le dessin selectionne',
    'modele=[' + Object.keys(modelePap).sort() + ']');
  assert(sandbox.currentDrawingId === 'papillon', 'currentDrawingId mis a jour par le selecteur');

  const svgPap = elements['principal-container'].querySelector('svg');
  const zonesPap = svgPap.querySelectorAll('.zone-coloriable');
  assert(zonesPap.length === 4, 'papillon : 4 zones coloriables', String(zonesPap.length));
  assert(svgPap.querySelector('#zone-soleil') === null, 'papillon : aucune zone de la maison ne subsiste');
  const idsPap = zonesPap.map(z => z.getAttribute('id')).sort();
  assert(JSON.stringify(idsPap) === JSON.stringify(Object.keys(modelePap).sort()),
    'papillon : les ids DOM correspondent exactement aux cles de MODELE_CIBLE',
    'ids=[' + idsPap + ']');

  const svgMiniPap = elements['miniature-container'].querySelector('svg');
  let ok = true, detail = '';
  Object.keys(modelePap).forEach(id => {
    if (!ok) return;
    const z = svgMiniPap.querySelector('#' + id);
    if (!z) { ok = false; detail = id + ' introuvable dans la miniature'; return; }
    if ((z.getAttribute('fill') || '').toUpperCase() !== modelePap[id].toUpperCase()) {
      ok = false; detail = id + ' = ' + z.getAttribute('fill') + ' au lieu de ' + modelePap[id];
    }
  });
  assert(ok, 'papillon : miniature 4/4 zones peintes', detail);
}

section('11. Non-regression des donnees');
{
  const total = DRAWINGS.reduce((s, d) => s + d.zones.length, 0);
  assert(DRAWINGS.length === 12, '12 dessins', String(DRAWINGS.length));
  assert(total === 51, '51 zones au total', String(total));
  assert(dessin.zones.length === 5, 'la maison conserve 5 zones');
}

console.log('');
console.log('RESUME : ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
