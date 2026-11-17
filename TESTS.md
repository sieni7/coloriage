# Checklist de Tests - Coloriage Préscolaire (V1.1)

## 1. Environnement
- [ ] Ouvrir `src/index.html` dans un navigateur moderne (Chrome, Safari, Firefox).
- [ ] Tester sur ordinateur (souris) et tablette tactile (doigt).

## 2. Affichage et Responsive
- [ ] Le format est bien en paysage (16:9) centré.
- [ ] En mode portrait (ou écran étroit), le message "Tourne ton appareil..." s'affiche et masque le jeu.
- [ ] Aucun débordement horizontal ou vertical (pas de scroll), y compris à 800x574.
- [ ] La palette des 6 feutres est entièrement visible sans défilement.
- [ ] Chaque feutre offre une cible tactile d'au moins 48x48 px.

## 3. Interactions (Palette)
- [ ] Au chargement, le premier feutre (Rouge) est sélectionné (bordure/ombre active).
- [ ] Cliquer sur un autre feutre le sélectionne visuellement et désélectionne le précédent.
- [ ] Un seul feutre peut être actif à la fois.

## 4. Interactions (Coloriage)
- [ ] Cliquer sur une zone blanche du grand dessin la colore avec la couleur active.
- [ ] Cliquer sur les contours noirs ou sur la miniature n'a aucun effet.
- [ ] Changer de couleur et cliquer sur une autre zone applique la nouvelle couleur.

## 5. Modèle de référence (statique)
- [ ] Le modèle de gauche est colorié au chargement et sert de référence fixe.
- [ ] Colorier le grand dessin ne modifie jamais le modèle.
- [ ] La porte et la fenêtre du modèle restent séparées et distinctes.

## 6. Validation et célébration
- [ ] Tant qu'une zone diffère du modèle, aucun overlay n'apparaît.
- [ ] Lorsque TOUTES les zones correspondent au modèle, l'overlay "Bravo !" apparaît.
- [ ] Le bouton "X" ferme l'overlay sans effacer le dessin.
- [ ] Après fermeture par "X", l'overlay ne se rouvre pas tant que le dessin reste conforme.
- [ ] Le bouton "Recommencer" efface le dessin et permet de rejouer.
- [ ] Après "Recommencer", la célébration peut se déclencher de nouveau.

## 7. Accessibilité
- [ ] L'overlay expose role="dialog", aria-modal="true" et un libellé.
- [ ] À l'ouverture, le focus va sur le bouton "X" ; à la fermeture, il revient au feutre actif.
- [ ] Les deux boutons de l'overlay ont un libellé vocal explicite.
- [ ] La navigation au clavier (Tab) atteint tous les feutres et les deux boutons.

## 8. Ergonomie Tactile
- [ ] Le double-tap sur l'écran ne sélectionne pas de texte.
- [ ] Le pinch-to-zoom ou le scroll parasite est désactivé sur la zone de jeu.