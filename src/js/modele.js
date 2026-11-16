// Applique les couleurs du modele cible au SVG de gauche au chargement
document.addEventListener('DOMContentLoaded', () => {
    const svgModele = document.querySelector('.svg-modele');
    if (svgModele && typeof MODELE_CIBLE !== 'undefined') {
        for (const [id, couleur] of Object.entries(MODELE_CIBLE)) {
            const zone = svgModele.querySelector('#' + id);
            if (zone) {
                zone.setAttribute('fill', couleur);
            }
        }
    }
});