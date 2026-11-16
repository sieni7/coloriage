// Logique de coloriage du dessin principal et synchronisation de la miniature
document.addEventListener('DOMContentLoaded', () => {
    const zoneDroite = document.querySelector('.zone-droite');
    if (!zoneDroite) return;

    // Délégation d'événement pour capturer les clics sur les zones coloriables
    zoneDroite.addEventListener('click', (event) => {
        const target = event.target;
        
        // Vérification stricte : on ne colore que si l'élément cliqué a la classe 'zone-coloriable'
        if (target.classList.contains('zone-coloriable')) {
            const zoneId = target.id;
            const activeColor = AppState.activeColor;
            
            // 1. Colorier la zone du grand dessin
            target.setAttribute('fill', activeColor);
            
            // 2. Synchroniser la miniature (sélecteur scopé pour éviter les conflits d'IDs)
            const miniZone = document.querySelector('.miniature-container #' + zoneId);
            if (miniZone) {
                miniZone.setAttribute('fill', activeColor);
            }
        }
    });
});