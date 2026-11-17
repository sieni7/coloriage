// Logique de validation, celebration et reinitialisation
let celebrationVue = false;

function ouvrirCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    const btnFermer = document.getElementById('btn-fermer');
    if (btnFermer) btnFermer.focus();
}

function fermerCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    const feutreActif = document.querySelector('.feutre.actif');
    if (feutreActif) feutreActif.focus();
}

function verifierDessin() {
    const svgPrincipal = document.querySelector('.svg-principal');
    if (!svgPrincipal || typeof MODELE_CIBLE === 'undefined') return;

    let toutCorrespond = true;
    for (const [id, couleurCible] of Object.entries(MODELE_CIBLE)) {
        const zone = svgPrincipal.querySelector('#' + id);
        if (zone) {
            const couleurActuelle = (zone.getAttribute('fill') || '').toUpperCase();
            if (couleurActuelle !== couleurCible.toUpperCase()) {
                toutCorrespond = false;
                break;
            }
        } else {
            toutCorrespond = false;
            break;
        }
    }

    if (toutCorrespond && !celebrationVue) {
        celebrationVue = true;
        ouvrirCelebration();
    } else if (!toutCorrespond) {
        celebrationVue = false;
    }
}

function recommencerDessin() {
    const svgPrincipal = document.querySelector('.svg-principal');
    if (!svgPrincipal || typeof MODELE_CIBLE === 'undefined') return;

    for (const id of Object.keys(MODELE_CIBLE)) {
        const zone = svgPrincipal.querySelector('#' + id);
        if (zone) {
            zone.setAttribute('fill', '#FFFFFF');
        }
    }

    celebrationVue = false;
    fermerCelebration();
}

document.addEventListener('DOMContentLoaded', () => {
    const btnRecommencer = document.getElementById('btn-recommencer');
    if (btnRecommencer) {
        btnRecommencer.addEventListener('click', recommencerDessin);
    }
    const btnFermer = document.getElementById('btn-fermer');
    if (btnFermer) {
        btnFermer.addEventListener('click', fermerCelebration);
    }
});