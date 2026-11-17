// Logique de selection de la palette (v3.3c : palette dynamique par dessin)
// Les feutres sont reconstruits par construirePalette(d) a chaque changement de dessin.
// La delegation d'evenement est posee UNE SEULE fois sur le conteneur : aucun ecouteur
// n'est perdu ni empile lors des reconstructions.
'use strict';

// Libelles lisibles pour les cles de COLORS (vocalisation correcte)
const NOMS_COULEURS = {
    rouge: 'Rouge',
    bleu: 'Bleu',
    jaune: 'Jaune',
    vert: 'Vert',
    orange: 'Orange',
    violet: 'Violet',
    rose: 'Rose',
    marron: 'Marron',
    noir: 'Noir',
    gris: 'Gris',
    bleuclair: 'Bleu clair'
};

window.construirePalette = function (d) {
    const conteneur = document.querySelector('.palette-container');
    if (!conteneur) return;
    if (!d || !Array.isArray(d.palette)) return;

    // Conserver le choix de l'enfant si la couleur reste disponible
    const ancien = conteneur.querySelector('.feutre.actif');
    const couleurActive = ancien ? ancien.getAttribute('data-color') : null;

    conteneur.innerHTML = '';

    d.palette.forEach(function (cle) {
        const hex = COLORS[cle];
        if (!hex) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'feutre';
        btn.setAttribute('data-color', hex);
        btn.setAttribute('aria-label', NOMS_COULEURS[cle] || cle);
        btn.style.backgroundColor = hex;
        conteneur.appendChild(btn);
    });

    // Reactivation : garder la couleur active si elle existe encore, sinon premier feutre
    const feutres = conteneur.querySelectorAll('.feutre');
    let cible = null;
    if (couleurActive) {
        cible = conteneur.querySelector('.feutre[data-color="' + couleurActive + '"]');
    }
    if (!cible && feutres.length > 0) {
        cible = feutres[0];
    }
    if (cible) {
        cible.classList.add('actif');
        AppState.activeColor = cible.getAttribute('data-color');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const conteneur = document.querySelector('.palette-container');
    if (!conteneur) return;

    // Delegation : un seul ecouteur, survit a la reconstruction des feutres
    conteneur.addEventListener('click', (event) => {
        const cible = event.target;
        if (!cible || typeof cible.closest !== 'function') return;
        const feutre = cible.closest('.feutre');
        if (!feutre || !conteneur.contains(feutre)) return;

        const feutres = conteneur.querySelectorAll('.feutre');
        for (let i = 0; i < feutres.length; i++) {
            feutres[i].classList.remove('actif');
        }
        feutre.classList.add('actif');
        AppState.activeColor = feutre.getAttribute('data-color');
    });
});
