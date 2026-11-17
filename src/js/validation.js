// Logique de validation et feedback positif
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

    if (toutCorrespond) {
        const overlay = document.getElementById('celebration-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
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

    const overlay = document.getElementById('celebration-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnRecommencer = document.getElementById('btn-recommencer');
    if (btnRecommencer) {
        btnRecommencer.addEventListener('click', recommencerDessin);
    }
});