# 🏝️ Charte Graphique : Sugar Swap (Style Casual Tropical)

Cette charte définit les contraintes visuelles strictes pour tous les composants UI du projet **Sugar Swap**. L'objectif est de reproduire l'esthétique exacte du menu principal (`image_4.png`) et du bouton d'action principal (`image_5.png`), en adoptant un style "Casual Tropical, Brillant, 3D et Pétillant".

---

## 1. Palette de Couleurs (Les "Friandises Tropicales")

L'identité couleur est divisée entre l'ambiance de fond (plage/ciel) et l'ambiance UI (boutons/glaçage).

### A. Couleurs d'Ambiance (Fond d'écran)

| Élément | Couleur Hex / Gradient | Usage |
| :--- | :--- | :--- |
| **Ciel Turquoise** | `#49D6FF` | Couleur de départ du dégradé (Haut). |
| **Horizon Sable** | `#FFEB3B` vers `#FFAB40` | Couleur de fin du dégradé (Bas/Milieu). |
| **Sol Désert** | `#FDD835` | Partie inférieure (Le sable actif). |

### B. Couleurs UI (Boutons et Panneaux)

| Élément | Couleur Hex / Gradient | Usage |
| :--- | :--- | :--- |
| **Action Principale**| `linear-gradient(to right, #E91E63 0%, #FF9800 100%)` | Boutons "Contre l'IA" et "Jouer !". Fond Rose vers Orange. |
| **Action Secondaire**| `linear-gradient(to right, #673AB7 0%, #03A9F4 100%)` | Bouton "En Ligne". Fond Violet vers Bleu Turquoise. |
| **Info / Règles** | `#03A9F4` | Bouton "Règles" (Fond Bleu uni uni brillant). |
| **Or Brillant** | `#FFD700` | Bordure épaisse et lumineuse autour de TOUS les boutons. |
| **Ombre Douce** | `#FFFE68` | Halo d'ombre portée subtil et lumineux sous les boutons. |
| **Fond Panneau** | `#212121` (Opacité 80-90%) | Fond noir très profond pour le modal "Comment Jouer". |
| **Confettis** | Fuchsia, Bleu, Jaune, Orange, Rouge | Petits éléments de particles flottant sur le fond. |

---

## 2. Typographie & Textes

- **Police Titre (ex: "Comment jouer ?") :** `Fredoka One` ou une police Google Fonts similaire, grasse et très arrondie. Couleur : `#FFD700` (Or) avec un `text-shadow` léger pour le détacher du fond noir.
- **Police Boutons (ex: "Jouer !") :** `Fredoka One` (ou similaire), gras et arrondi. Couleur : `White` (`#FFFFFF`). Un `text-shadow` noir très fin peut être ajouté pour la lisibilité sur fond clair.
- **Police d'Info (ex: "2-8 joueurs") :** Même famille mais en graisse médium. Couleur : `White` (`#FFFFFF`).

---

## 3. Composants UI : Les "Briques en Glaçage"

### A. Le Panneau Modal (Comment Jouer)
- **Fond :** `#212121` (Noir profond).
- **Forme :** `rounded-3xl` (très arrondis).
- **Effets :** Bordure lumineuse dorée de 3px et une ombre portée douce jaune/dorée (`shadow-[0_4px_10px_0_rgba(255,254,104,0.5)]`).
- **Titre :** Centré, typographie d'Or, comme une gravure sucrée.

### B. Les Boutons "Bouncy Candy"
C'est le composant signature.
- **Forme :** `rounded-full` (extrémités totalement semi-circulaires).
- **Bordure :** Bordure dorée (`border-4 border-[#FFD700]`).
- **Fond :** Gradient brillant.
- **Icone :** Icône mignonne (Robot, Globe, Icône de carte style sablé) à gauche du texte.
- **Reflet :** Un dégradé intérieur subtil blanc semi-transparent en haut pour donner l'effet "sucré/vitrifié".
- **Interaction :**
  - `active:scale-95 translate-y-1` (le bouton s'enfonce).
  - `hover:brightness-110`.

### C. Le Logo
- **Design :** Design 3D gélifié. "Sugar" en Rose pétillant, "Swap" en Bleu/Orange/Jaune. Toujours centré et en grand.

---

## 4. Atmosphère & Effets (Le "Juicy Tropical")

- **Fond :** Dégradé Tropical (Bleu/Sable). Ajouter des palmiers (`blurred-md`) dans les coins inférieurs.
- **Particules :** Utiliser Framer Motion pour faire flotter des petits confettis rectangulaires multicolores (fuchsia, bleu, jaune, orange, rouge) de manière aléatoire sur le fond.
- **Transitions :** > - Effet "Spring" (ressort) doux sur toutes les apparitions de modaux. > - `scale-105` sur le hover des boutons pour un effet d'appel pétillant.

---

## 🚀 Utilisation avec Cursor

*Référence ce fichier dans tes instructions pour garantir la cohérence :*
> "Consulte `CHARTE_GRAPHIQUE.md` pour adapter tous les composants UI au style Sugar Swap Tropical Casual."