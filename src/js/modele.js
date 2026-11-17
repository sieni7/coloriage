'use strict';

// Graine : Date.now() par defaut, injectable via window.currentSeed pour les tests.
function graineCourante() {
    if (typeof window !== 'undefined' && window.currentSeed) { return window.currentSeed; }
    return Date.now();
}

function dessinCourant() {
    const id = (typeof window !== 'undefined' && window.currentDrawingId) ? window.currentDrawingId : 'maison';
    return DRAWINGS.find(d => d.id === id) || DRAWINGS[0];
}

window.renderCurrentDrawing = function () {
    const d = dessinCourant();
    if (!d) return;

    // v3.3c : la palette suit le dessin (outils disponibles = couleurs du dessin).
    // Garde typeof : tests-v3.3b.js charge modele.js sans palette.js.
    if (typeof construirePalette === 'function') { construirePalette(d); }

    const modeleCles = randomizeModel(d, graineCourante());

    // Vidage des anciennes cles avant reconstruction (R4)
    Object.keys(MODELE_CIBLE).forEach(k => delete MODELE_CIBLE[k]);

    // Mapping strict : renderDrawing emet id="zone-${z.id}"
    for (const [id, colorKey] of Object.entries(modeleCles)) {
        if (COLORS[colorKey]) { MODELE_CIBLE['zone-' + id] = COLORS[colorKey]; }
    }

    const dModel = { ...d, zones: d.zones.map(z => ({ ...z, color: modeleCles[z.id] })) };

    const miniature = document.getElementById('miniature-container');
    if (miniature) { miniature.innerHTML = renderDrawing(dModel, { model: true }); }

    const principal = document.getElementById('principal-container');
    if (principal) { principal.innerHTML = renderDrawing(d, { model: false }); }
};

document.addEventListener('DOMContentLoaded', () => {
    window.renderCurrentDrawing();
});
