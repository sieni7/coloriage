# Checklist de Tests - Coloriage Préscolaire (V1)

## 1. Environnement
- [ ] Ouvrir `src/index.html` dans un navigateur moderne (Chrome, Safari, Firefox).
- [ ] Tester sur ordinateur (souris) et tablette tactile (doigt).

## 2. Affichage et Responsive
- [ ] Le format est bien en paysage (16:9) centré.
- [ ] En mode portrait (ou écran étroit), le message "Tourne ton appareil..." s'affiche et masque le jeu.
- [ ] Aucun débordement horizontal ou vertical (pas de scroll).

## 3. Interactions (Palette)
- [ ] Au chargement, le premier feutre (Rouge) est sélectionné (bordure/ombre active).
- [ ] Cliquer sur un autre feutre le sélectionne visuellement et désélectionne le précédent.
- [ ] Un seul feutre peut être actif à la fois.

## 4. Interactions (Coloriage)
- [ ] Cliquer sur une zone blanche du grand dessin la colore avec la couleur active.
- [ ] Cliquer sur les contours noirs n'a aucun effet.
- [ ] Cliquer sur la miniature n'a aucun effet.
- [ ] Changer de couleur et cliquer sur une autre zone applique la nouvelle couleur.

## 5. Synchronisation
- [ ] Lorsqu'une zone du grand dessin est coloriée, la zone correspondante de la miniature se colore instantanément avec la même couleur.

## 6. Ergonomie Tactile
- [ ] Le double-tap sur l'écran ne sélectionne pas de texte.
- [ ] Le pinch-to-zoom ou le scroll parasite est désactivé sur la zone de jeu.