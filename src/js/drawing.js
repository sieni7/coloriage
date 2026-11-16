// Logique de coloriage du dessin principal
document.addEventListener('DOMContentLoaded', () => {
    const zoneDroite = document.querySelector('.zone-droite');
    if (!zoneDroite) return;

    // Délégation d'événement pour capturer les clics sur les zones coloriables
    zoneDroite.addEventListener('click', (event) => {
        const target = event.target;
        
        // Vérification stricte : on ne colore que si l'élément cliqué a la classe 'zone-coloriable'
        // Cela ignore automatiquement les contours (pointer-events: none) et la miniature.
        if (target.classList.contains('zone-coloriable')) {
            target.setAttribute('fill', AppState.activeColor);
        }
    });
});