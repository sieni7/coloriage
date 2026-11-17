// Applique les couleurs du modele cible au SVG de gauche au chargement
document.addEventListener('DOMContentLoaded', () => {
    const svgModele = document.querySelector('.svg-modele');
    if (!svgModele) return;

    const ID_MAP = {
        'soleil': 'zone-soleil',
        'toit': 'zone-toit',
        'mur': 'zone-murs',
        'porte': 'zone-porte',
        'fenetre': 'zone-fenetre'
    };

    const dessin = DRAWINGS.find(d => d.id === 'maison');
    const seed = 42;
    const modeleCles = randomizeModel(dessin, seed);

    const MODELE_HEX = {};
    for (const [id, colorKey] of Object.entries(modeleCles)) {
        const domId = ID_MAP[id];
        if (domId && COLORS[colorKey]) {
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