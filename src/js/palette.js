// Logique de sélection de la palette
document.addEventListener('DOMContentLoaded', () => {
    const feutres = document.querySelectorAll('.feutre');
    
    // Initialisation : activer le premier feutre par défaut pour une UX immédiate
    if (feutres.length > 0) {
        feutres[0].classList.add('actif');
        AppState.activeColor = feutres[0].getAttribute('data-color');
    }

    feutres.forEach(feutre => {
        feutre.addEventListener('click', () => {
            // 1. Retirer la classe actif de tous les feutres
            feutres.forEach(f => f.classList.remove('actif'));
            
            // 2. Ajouter la classe actif au feutre cliqué
            feutre.classList.add('actif');
            
            // 3. Mettre à jour l'état global
            AppState.activeColor = feutre.getAttribute('data-color');
            
        });
    });
});