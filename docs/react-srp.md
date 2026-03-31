---
description: Principe de responsabilité unique (SRP) en React — un composant, une raison de changer
globs: apps/frontend/src/**/*
alwaysApply: true
---

# Single Responsibility Principle (SRP) en React

Chaque composant doit avoir **une seule raison de changer** : une seule responsabilité, une seule tâche ou un seul aspect de l’UI. Référence : [SOLID in React – Single Responsibility (Medium)](https://medium.com/@hossein.khoshnevis77/solid-in-react-js-single-responsibility-9fbfde0c2e49).

## Idée centrale

- **Séparation des préoccupations** : éviter les gros composants qui font à la fois fetch, state et rendu. Les décomposer en morceaux focalisés.
- **Exemple à éviter** : un composant qui affiche des détails utilisateur **et** les récupère via l’API a deux raisons de changer (design UI vs endpoint / logique de fetch). Selon le SRP, ces deux rôles doivent être dans des composants ou modules distincts.

## Application pratique (alignée avec l’article)

1. **Hooks pour la donnée et la logique**
   - **useXxx** pour le fetch / mutations (ex. `useProfile` : query + mutation).
   - **useXxx** pour l’état UI ou filtres (ex. `useFilter`, `useEditPersonalForm`).
   - Un hook = une responsabilité (données OU état de filtre OU formulaire).

2. **Fonctions pures pour les dérivations**
   - Calculs dérivés (filtrage, formatage, style dérivé) dans des **utils** ou **pure functions** (ex. `filterProducts(products, rate)`, `getProfileDisplayName(profile)`, `getBannerBackgroundStyle(profile)`).
   - Testables sans React.

3. **Composants présentatifs**
   - Un composant = un bloc d’UI identifiable (ex. `ProfileAvatar`, `ProfileBanner`, `SkillTag`, `Product`, `StarRate`). Ils ne font que du rendu à partir de props ; pas d’API, pas de state métier.

4. **Orchestrateur fin**
   - La page ou le container : utilise les hooks, appelle les fonctions pures, compose les composants présentatifs et passe les callbacks. Peu de JSX propre ; surtout composition et branchements (loading, error, contenu).

## Structure type (feature)

- `hooks/useProfile.ts` — donnée profil + mutation
- `hooks/useEditPersonalForm.ts` — état du formulaire d’édition
- `utils/profileDisplay.ts` — getDisplayName, getInitials, getBannerStyle (purs)
- `components/ProfileAvatar.tsx`, `ProfileBanner.tsx`, … — présentatifs
- `ProfilePageContent.tsx` — orchestrateur qui utilise hooks + utils et compose les composants

## Bénéfices

- **Maintenabilité** : un changement local a moins d’impact sur le reste.
- **Testabilité** : hooks et fonctions pures testables à part ; composants présentatifs testables avec des props.
- **Réutilisabilité** : petits composants et hooks réutilisables.
- **Lisibilité** : le rôle de chaque fichier est clair.

En résumé : un composant = une responsabilité ; données (hooks) + dérivations (utils) + rendu (composants) + orchestration (page/container).
