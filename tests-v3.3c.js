// tests-v3.3c.js - palette dynamique : construction, jouabilite, delegation, integration
// Execute le VRAI palette.js et le VRAI modele.js dans un seul contexte vm (window === global).
// DOM stub : enfants reels, selecteurs .feutre / .feutre.actif / .feutre[data-color="..."].
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0, failed = 0;
function assert(cond, msg, detail) {
    if (cond) { passed++; console.log('  OK    ' + msg); }
    else { failed++; console.log('  ECHEC ' + msg + (detail ? '  -> ' + detail : '')); }
}
function section(t) { console.log('\n[' + t + ']'); }

const base = path.resolve(__dirname);
const lire = f => fs.readFileSync(path.join(base, f), 'utf8');

/* ------------------------------------------------------------------ */
/* DOM minimal : enfants, classes, attributs, style, selecteurs        */
/* ------------------------------------------------------------------ */
function correspond(noeud, sel) {
    if (!sel) return false;
    if (sel.charAt(0) === '.') {
        const m = sel.match(/^\.([\w-]+)(?:\.([\w-]+))?(?:\[data-color="([^"]+)"\])?$/);
        if (!m) return false;
        const classes = (noeud.attrs['class'] || '').split(/\s+/);
        if (classes.indexOf(m[1]) < 0) return false;
        if (m[2] && classes.indexOf(m[2]) < 0) return false;
        if (m[3] !== undefined && noeud.getAttribute('data-color') !== m[3]) return false;
        return true;
    }
    if (sel.charAt(0) === '#') return noeud.attrs.id === sel.slice(1);
    return noeud.tagName === sel.toLowerCase();
}

function parcourir(noeud, cb) {
    for (const enfant of noeud.children) { cb(enfant); parcourir(enfant, cb); }
}

function creerNoeud(tag) {
    const noeud = {
        tagName: String(tag).toLowerCase(),
        attrs: {},
        children: [],
        parentNode: null,
        style: {},
        _html: '',
        _listeners: {},
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) {
            return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null;
        },
        appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
        addEventListener(t, cb) { (this._listeners[t] = this._listeners[t] || []).push(cb); },
        dispatch(t, ev) { (this._listeners[t] || []).forEach(cb => cb(ev)); },
        contains(c) {
            if (c === this) return true;
            let trouve = false;
            parcourir(this, n => { if (n === c) trouve = true; });
            return trouve;
        },
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
        get() { return this.attrs['class'] || ''; },
        set(v) { this.attrs['class'] = String(v); }
    });

    Object.defineProperty(noeud, 'classList', {
        get() {
            const self = this;
            return {
                contains(c) { return (self.attrs['class'] || '').split(/\s+/).indexOf(c) >= 0; },
                add(c) {
                    const l = (self.attrs['class'] || '').split(/\s+/).filter(Boolean);
                    if (l.indexOf(c) < 0) l.push(c);
                    self.attrs['class'] = l.join(' ');
                },
                remove(c) {
                    self.attrs['class'] = (self.attrs['class'] || '')
                        .split(/\s+/).filter(x => x && x !== c).join(' ');
                }
            };
        }
    });

    Object.defineProperty(noeud, 'innerHTML', {
        get() { return this._html; },
        set(valeur) {
            this._html = String(valeur);
            this.children = [];
        }
    });

    return noeud;
}

/* ------------------------------------------------------------------ */
/* Contexte unique                                                     */
/* ------------------------------------------------------------------ */
function creerMonde() {
    const palette = creerNoeud('div');
    palette.className = 'palette-container';

    const elements = {
        'miniature-container': creerNoeud('div'),
        'principal-container': creerNoeud('div')
    };

    const ecouteursDocument = [];
    const documentStub = {
        getElementById(id) { return elements[id] || null; },
        querySelector(sel) {
            if (correspond(palette, sel)) return palette;
            return palette.querySelector(sel);
        },
        createElement(tag) { return creerNoeud(tag); },
        addEventListener(evt, cb) { if (evt === 'DOMContentLoaded') ecouteursDocument.push(cb); }
    };

    const sandbox = {
        console,
        module: { exports: {} },
        exports: {},
        document: documentStub
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);

    ['src/js/state.js', 'src/js/config.js', 'src/js/drawings.js',
     'src/js/palette.js', 'src/js/modele.js'].forEach(f => {
        vm.runInContext(lire(f), sandbox, { filename: f });
    });

    return {
        sandbox,
        palette,
        elements,
        demarrer(seed, dessin) {
            sandbox.currentDrawingId = dessin || 'maison';
            sandbox.currentSeed = seed;
            ecouteursDocument.forEach(cb => cb());
        }
    };
}

const monde = creerMonde();
monde.demarrer(42, 'maison');

const DRAWINGS = vm.runInContext('DRAWINGS', monde.sandbox);
const COLORS = vm.runInContext('COLORS', monde.sandbox);
const AppState = vm.runInContext('AppState', monde.sandbox);
const modele = vm.runInContext('MODELE_CIBLE', monde.sandbox);
const paletteSrc = lire('src/js/palette.js');
const modeleSrc = lire('src/js/modele.js');
const htmlSrc = lire('src/index.html');
const cssSrc = lire('src/css/components.css');

function feutres() { return monde.palette.querySelectorAll('.feutre'); }

/* ------------------------------------------------------------------ */
section('1. Cablage : palette dynamique branchee');
{
    assert(modeleSrc.indexOf('construirePalette(d)') >= 0, 'modele.js appelle construirePalette(d)');
    assert(modeleSrc.indexOf('construirePalette(d)') < modeleSrc.indexOf('randomizeModel('),
        'la palette est construite avant le tirage du modele');
    assert(paletteSrc.indexOf('window.construirePalette') >= 0, 'palette.js expose window.construirePalette');
    assert(/conteneur\.addEventListener\('click'/.test(paletteSrc),
        'palette.js attache la delegation sur le conteneur');
    assert(paletteSrc.indexOf('feutre.addEventListener') < 0,
        'palette.js n attache plus un ecouteur par feutre');
    assert(htmlSrc.indexOf('<div class="palette-container"></div>') >= 0,
        'index.html contient un .palette-container vide');
    assert(htmlSrc.indexOf('class="feutre"') < 0, 'index.html n a plus de feutre statique');
    assert(htmlSrc.indexOf('js/palette.js') < htmlSrc.indexOf('js/modele.js'),
        'palette.js est charge avant modele.js');
    assert(/grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(48px,\s*1fr\)\)/.test(cssSrc),
        'components.css fait tenir 4 feutres par ligne (auto-fit, 48px)');
}

section('2. Premier rendu : 8 feutres pour la maison');
{
    assert(feutres().length === 8, 'la maison affiche 8 feutres', String(feutres().length));
    assert(AppState.activeColor === '#ff0000', 'le premier feutre (rouge) est actif', AppState.activeColor);
    assert(monde.palette.querySelectorAll('.feutre.actif').length === 1, 'un seul feutre actif');
    const idsSvg = (monde.elements['principal-container'].innerHTML.match(/id="zone-[\w-]+"/g) || []).length;
    assert(idsSvg === 5, 'le principal contient 5 zones', String(idsSvg));
    assert(Object.keys(modele).length === 5, 'MODELE_CIBLE contient 5 cles');
    assert(monde.elements['miniature-container'].innerHTML.indexOf('zone-soleil') >= 0,
        'la miniature est generee par le meme moteur');
}

section('3. 12 dessins : feutres = palette, hex valides, fond inline, libelle');
{
    DRAWINGS.forEach(d => {
        monde.sandbox.construirePalette(d);
        const f = feutres();
        const attendus = d.palette.map(c => COLORS[c]);
        const obtenus = f.map(x => x.getAttribute('data-color'));
        assert(f.length === d.palette.length,
            d.id + ' : ' + d.palette.length + ' feutres', String(f.length));
        assert(JSON.stringify(obtenus) === JSON.stringify(attendus),
            d.id + ' : data-color = COLORS[palette] dans l ordre', '[' + obtenus + ']');
        let fondOk = true, labelOk = true, classeOk = true;
        f.forEach(x => {
            if (x.style.backgroundColor !== x.getAttribute('data-color')) fondOk = false;
            if ((x.getAttribute('aria-label') || '').length === 0) labelOk = false;
            if (!x.classList.contains('feutre')) classeOk = false;
        });
        assert(fondOk, d.id + ' : fond inline pose sur chaque feutre');
        assert(labelOk, d.id + ' : aria-label present sur chaque feutre');
        assert(classeOk, d.id + ' : classe feutre sur chaque bouton');
        assert(new Set(obtenus).size === obtenus.length, d.id + ' : aucun feutre en double');
    });
}

section('4. Jouabilite : chaque couleur du modele a son feutre (12 x 100 graines)');
{
    const randomizeModel = vm.runInContext('randomizeModel', monde.sandbox);
    let manques = 0, detail = '';
    DRAWINGS.forEach(d => {
        monde.sandbox.construirePalette(d);
        const dispo = new Set(feutres().map(x => x.getAttribute('data-color')));
        for (let s = 0; s < 100; s++) {
            const m = randomizeModel(d, 1000 + s * 7919);
            Object.keys(m).forEach(id => {
                if (!dispo.has(COLORS[m[id]])) {
                    manques++;
                    if (!detail) detail = d.id + ' zone ' + id + ' couleur ' + m[id];
                }
            });
        }
    });
    assert(manques === 0, '1200 tirages : aucune couleur absente de la palette', manques + ' manques ' + detail);
}

section('5. Couleurs nouvelles : noir, bleuclair, gris, rose');
{
    const par = {};
    DRAWINGS.forEach(d => {
        monde.sandbox.construirePalette(d);
        par[d.id] = new Set(feutres().map(x => x.getAttribute('data-color')));
    });
    assert(par['poisson'].has('#000000'), 'poisson : un feutre noir');
    assert(par['poisson'].has('#87ceeb'), 'poisson : un feutre bleu clair');
    assert(par['bateau'].has('#808080'), 'bateau : un feutre gris');
    assert(par['glace'].has('#ff69b4'), 'glace : un feutre rose');
    monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === 'poisson'));
    const label = feutres().filter(x => x.getAttribute('data-color') === '#87ceeb')[0].getAttribute('aria-label');
    assert(label === 'Bleu clair', 'libelle vocal "Bleu clair"', label);
}

section('6. Delegation : clic reel, sans empilement d ecouteurs');
{
    const conteneur = monde.palette;
    assert((conteneur._listeners.click || []).length === 1,
        'un seul ecouteur de clic sur le conteneur', String((conteneur._listeners.click || []).length));

    monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === 'poisson'));
    const cible = feutres()[3];
    conteneur.dispatch('click', { target: cible });
    assert(AppState.activeColor === cible.getAttribute('data-color'),
        'clic : AppState prend le data-color du feutre', AppState.activeColor);
    assert(cible.classList.contains('actif'), 'clic : le feutre clique est actif');
    assert(conteneur.querySelectorAll('.feutre.actif').length === 1,
        'clic : un seul feutre actif', String(conteneur.querySelectorAll('.feutre.actif').length));

    ['glace', 'bateau', 'maison'].forEach(id => {
        monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === id));
        conteneur.dispatch('click', { target: feutres()[1] });
    });
    assert((conteneur._listeners.click || []).length === 1,
        'apres 3 reconstructions : toujours un seul ecouteur',
        String((conteneur._listeners.click || []).length));
    assert(conteneur.querySelectorAll('.feutre.actif').length === 1,
        'apres 3 reconstructions : toujours un seul actif');
    assert(feutres().length === 8, 'maison restauree : 8 feutres', String(feutres().length));
}

section('7. Reactivation : la couleur choisie survit si elle existe encore');
{
    monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === 'bateau'));
    monde.palette.dispatch('click', { target: feutres()[0] });
    assert(AppState.activeColor === '#8b4513', 'bateau : marron choisi par clic', AppState.activeColor);
    monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === 'poisson'));
    assert(AppState.activeColor === '#ffa500', 'poisson : marron absent -> repli sur orange', AppState.activeColor);
    monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === 'glace'));
    assert(AppState.activeColor === '#ffa500', 'glace : orange conserve', AppState.activeColor);
    monde.sandbox.construirePalette(DRAWINGS.find(d => d.id === 'voiture'));
    assert(AppState.activeColor === '#ff0000', 'voiture : orange absent -> repli sur rouge', AppState.activeColor);
}

section('8. Changement de dessin : palette et SVG suivent ensemble');
{
    monde.sandbox.currentDrawingId = 'bateau';
    monde.sandbox.currentSeed = 7;
    monde.sandbox.renderCurrentDrawing();
    assert(feutres().length === 7, 'bateau : 7 feutres', String(feutres().length));
    assert(feutres().some(x => x.getAttribute('data-color') === '#808080'), 'bateau : feutre gris present');
    const idsBateau = Array.from(monde.elements['principal-container'].innerHTML.matchAll(/id="(zone-[\w-]+)"/g))
        .map(m => m[1]).sort();
    const clesBateau = Object.keys(vm.runInContext('MODELE_CIBLE', monde.sandbox)).sort();
    assert(JSON.stringify(idsBateau) === JSON.stringify(clesBateau),
        'bateau : ids du SVG == cles de MODELE_CIBLE', idsBateau + ' vs ' + clesBateau);

    monde.sandbox.currentDrawingId = 'glace';
    monde.sandbox.currentSeed = 99;
    monde.sandbox.renderCurrentDrawing();
    assert(feutres().length === 7, 'glace : 7 feutres', String(feutres().length));
    assert(feutres().some(x => x.getAttribute('data-color') === '#ff69b4'), 'glace : feutre rose present');
    assert(Object.keys(vm.runInContext('MODELE_CIBLE', monde.sandbox)).length === 3,
        'glace : 3 cles dans MODELE_CIBLE');
    assert(monde.palette.querySelectorAll('.feutre.actif').length === 1,
        'glace : un seul feutre actif apres changement de dessin');
}

section('9. Robustesse : appel sans palette');
{
    let leve = false;
    try { monde.sandbox.construirePalette({ id: 'x' }); } catch (e) { leve = true; }
    assert(!leve, 'construirePalette({}) ne leve pas');
    assert(feutres().length === 7, 'la palette precedente est intacte', String(feutres().length));
}

console.log('');
console.log('RESUME : ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
