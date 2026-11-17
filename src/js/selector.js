'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('selector-container');
  if (!container) return;

  DRAWINGS.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'selector-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Choisir le dessin : ' + d.nom);

    btn.innerHTML = renderDrawing(d, { model: true, strokeWidth: 2 }) +
      '<span class="selector-label">' + d.nom + '</span>';

    btn.addEventListener('click', () => {
      window.currentDrawingId = d.id;
      window.currentSeed = Date.now();
      if (typeof window.renderCurrentDrawing === 'function') {
        window.renderCurrentDrawing();
      }
      const boutons = container.querySelectorAll('.selector-btn');
      for (let i = 0; i < boutons.length; i++) { boutons[i].classList.remove('actif'); }
      btn.classList.add('actif');
    });

    container.appendChild(btn);
  });
});
