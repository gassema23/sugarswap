---
description: Structure par features (frontend uniquement) — encapsulation, modularité, types colocalisés, shared/
globs: apps/frontend/src/**/*
alwaysApply: true
---

# Structure par features — Frontend

Cette règle s’applique **uniquement au frontend**. Le code est organisé par **feature** (domaine fonctionnel), pas par type de fichier. Cela améliore la modularité, la maintenabilité et la scalabilité.

## Structure typique (frontend)

```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/   (composants propres à la feature)
│   │   ├── hooks/
│   │   ├── services/     (logique / appels API) ou api.ts
│   │   ├── types/        (interfaces/types propres à la feature)
│   │   └── index.ts      (point d’entrée / exports publics)
│   ├── users/
│   └── products/
├── shared/
│   ├── components/       (réutilisables entre features)
│   ├── utils/            (helpers communs)
│   └── types/            (types globaux)
├── components/           (UI réutilisable, ex. shadcn)
└── ...
```

## Principes clés

1. **Encapsulation** : tout ce qui appartient à une feature reste dans son dossier. Ajouter ou retirer une feature = ajouter/supprimer le dossier correspondant.

2. **Modularité** : les features sont indépendantes. **Pas d’import direct d’une feature vers une autre.** La communication se fait via shared (services, state global, events).

3. **Logique partagée centralisée** : composants réutilisables, utils, types globaux → `shared/`. Ce code est traité comme une lib partagée.

4. **Types colocalisés** : les types/interfaces spécifiques à une feature sont définis **dans le dossier de la feature** (ex. `types.ts`, `validation.ts`), au plus près de l’usage.

5. **Maintenabilité** : en gardant la surface de chaque feature réduite, les changements dans une feature ont moins de risque de casser une autre.

## Configuration

- **baseUrl** et **paths** dans le `tsconfig.json` du frontend pour des imports propres : `@/shared`, `@/features/...`, `@/lib`, etc.
- Privilégier les alias plutôt que les chemins relatifs longs.

## Alignement avec ce projet (frontend)

- **features/** : `features/<domaine>/<sous-domaine>/` avec `api.ts`, hooks, `*PageView.tsx`, `*PageContent.tsx`, `validation.ts`, `types.ts` si besoin.
- **shared/** : layouts, authorizations, composants UI communs, utils.
- **components/** : composants UI réutilisables (ex. shadcn, quebec).

Lors de l’ajout d’une nouvelle feature frontend, créer un dossier dédié sous `frontend/src/features/`, y placer composants/hooks/api/types, et n’exposer que le strict nécessaire via `index.ts`. Les dépendances entre features passent par `shared/` ou des contrats (API, events).
