// Applique les couleurs du modele cible au SVG de gauche au chargement
document.addEventListener('DOMContentLoaded', () => {
    const svgModele = document.querySelector('.svg-modele');
    if (!svgModele) return;

    // Moteur generique : DRAWING_ID sera pilote par le selecteur en v3.3b
    const DRAWING_ID = 'maison';
    const seed = 42;

    const dessin = DRAWINGS.find(d => d.id === DRAWING_ID);
    const modeleCles = randomizeModel(dessin, seed);

    // Vidage des anciennes cles avant reconstruction (R4)
    Object.keys(MODELE_CIBLE).forEach(k => delete MODELE_CIBLE[k]);

    // Mapping generique : le helper domIdFor porte l'unique exception historique
    const MODELE_HEX = {};
    for (const [id, colorKey] of Object.entries(modeleCles)) {
        const domId = domIdFor(dessin, id);
        if (COLORS[colorKey]) {
            MODELE_HEX[domId] = COLORS[colorKey];
        }
    }
    Object.assign(MODELE_CIBLE, MODELE_HEX);

    for (const [id, couleur] of Object.entries(MODELE_CIBLE)) {
        const zone = svgModele.querySelector('#' + id);
        if (zone) {
            zone.setAttribute('fill', couleur);
        }
    }
});