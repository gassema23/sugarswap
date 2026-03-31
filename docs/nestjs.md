---
description: Meilleures pratiques NestJS (backend uniquement) — modules, DI, pipes, guards, typage strict
globs: apps/gateway/src/**/*
alwaysApply: true
---

# NestJS — Backend uniquement

Cette règle s’applique **uniquement au backend**. Les bonnes pratiques NestJS visent une architecture modulaire, un typage TypeScript strict et l’injection de dépendances pour la maintenabilité et la scalabilité.

## Pratiques et conventions clés

1. **Architecture modulaire** : organiser le code en modules distincts, chacun avec une responsabilité unique (ex. `UserModule`, `AuthModule`, `HolidaysModule`).

2. **Injection de dépendances** : utiliser le système DI de NestJS pour les dépendances entre modules et services ; le code reste flexible et testable.

3. **Validation et transformation** : utiliser les **Pipes** (ex. `ValidationPipe` avec `class-validator`) pour valider et transformer les données d’entrée des requêtes. Les DTOs dans `dto/` avec décorateurs (`IsString`, `IsUUID`, etc.).

4. **Gestion des erreurs** : implémenter des **ExceptionFilters** personnalisés pour gérer les erreurs de manière cohérente dans toute l’application.

5. **Sécurité et gardes** : utiliser des **Guards** pour l’authentification et l’autorisation (JWT, rôles, permissions) afin de protéger les routes. Décorateurs `@UseGuards()`, `@Roles()`, `@Permissions()`.

6. **Typage strict (TypeScript)** : profiter au maximum du typage statique (interfaces, DTOs, types de retour explicites) pour la qualité et la maintenabilité.

7. **Tests** : écrire des tests unitaires et e2e avec Jest (configuré par défaut avec NestJS).

8. **Cohérence du code** : appliquer un style cohérent avec ESLint et Prettier.

9. **Configuration** : utiliser `@nestjs/config` pour gérer les variables d’environnement de manière centralisée.

## Conventions de nommage (backend)

- **Fichiers** : **kebab-case** — `user.controller.ts`, `auth.service.ts`, `create-user.dto.ts`.
- **Classes et variables** : **camelCase** pour variables/fonctions, **PascalCase** pour classes — `UserController`, `AuthService`, `createUser`.
- **Structure par ressource** :
  - `nom.module.ts` (ex. `holidays.module.ts`)
  - `nom.controller.ts` (ex. `holidays.controller.ts`)
  - `nom.service.ts` (ex. `holidays.service.ts`)
  - `dto/create-nom.dto.ts`, `dto/update-nom.dto.ts`

## Alignement avec ce projet (backend)

- **Modules** : un module par ressource (controller + service + DTOs). Pas de logique métier dans le controller.
- **Service** : logique métier, Prisma, gestion des conflits et soft delete.
- **Soft delete** : entités avec `deletedAt` ; liste avec `filter=active|deleted|all` ; endpoint `PATCH /:id/restore` pour restaurer.
- **Sécurité** : guards JWT + permissions ; décorateur `CurrentUser` pour tracer created/updated/deleted.
- **DTOs** : dans un dossier `dto/` par module ; validation avec class-validator.

Lors de l’ajout ou la modification de code backend, respecter les conventions de nommage (kebab-case pour les fichiers), garder la logique dans les services, et utiliser pipes/guards pour validation et sécurité.
