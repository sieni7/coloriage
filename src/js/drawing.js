// Logique de coloriage du dessin principal
document.addEventListener('DOMContentLoaded', () => {
    const svgPrincipal = document.querySelector('.svg-principal');
    if (!svgPrincipal) return;

    // Delegation d'evenement : les zones sont regenerees a chaque changement de dessin,
    // mais le conteneur .svg-principal reste en place et conserve son ecouteur.
    svgPrincipal.addEventListener('click', (event) => {
        const cible = event.target;
        if (!cible || typeof cible.closest !== 'function') return;

        // Le clic tombe sur un enfant du <g> (circle, polygon, rect) : on remonte au groupe.
        const zone = cible.closest('.zone-coloriable');
        if (!zone) return;

        const activeColor = AppState.activeColor;
        if (!activeColor) return;

        zone.setAttribute('fill', activeColor);
        if (typeof verifierDessin === 'function') { verifierDessin(); }
    });
});
