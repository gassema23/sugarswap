---
description: NestJS Repository Pattern — Controller-Service-Repository architecture pour le gateway
globs: apps/gateway/**/*.ts
alwaysApply: true
---

# NestJS Repository Pattern

Cette règle définit l'architecture Controller-Service-Repository pour le gateway NestJS de Vynia.

## Architecture en 3 couches

### 1. Controller (Couche Présentation)
- **Responsabilité** : Gère les requêtes HTTP et les réponses
- **Interactions** : Route les requêtes vers le Service approprié
- **Règles** :
  - Pas de logique métier dans le controller
  - Validation des entrées via DTOs et Pipes
  - Gestion de l'authentification via Guards
  - Transformation des réponses si nécessaire

### 2. Service (Couche Métier)
- **Responsabilité** : Contient la logique métier, validation et transformation des données
- **Interactions** : Orchestre les opérations en utilisant un ou plusieurs Repositories
- **Règles** :
  - Pas d'accès direct à TypeORM Repository (utiliser les interfaces de repository)
  - Injection via interface (`@Inject(IXxxRepository)`)
  - Peut appeler d'autres services
  - Gère les transactions si nécessaire

### 3. Repository (Couche Données)
- **Responsabilité** : Abstrait la couche de données, fournit une API propre pour travailler avec la persistance
- **Interactions** : Interagit directement avec la base de données via TypeORM
- **Règles** :
  - Hérite de `BaseRepository` (dans `@common/database`)
  - Implémente une interface (`IXxxRepository`)
  - Pas de logique métier
  - Support des transactions via `EntityManager` optionnel

## Structure des fichiers

```
src/modules/<domaine>/
├── dto/
├── entity/
├── repositories/
│   ├── <entity>.repository.interface.ts  # Interface abstraite
│   ├── <entity>.repository.ts            # Implémentation
│   ├── <entity>.repository.provider.ts   # Provider NestJS
│   └── index.ts                          # Exports
├── <domaine>.controller.ts
├── <domaine>.service.ts
└── <domaine>.module.ts
```

## Exemple complet

### 1. Interface Repository

```typescript
// repositories/user.repository.interface.ts
import { EntityManager } from 'typeorm';
import { User } from '../entity/user.entity';

export abstract class IUserRepository {
  abstract findById(id: string, entityManager?: EntityManager): Promise<User | null>;
  abstract findByEmail(email: string, entityManager?: EntityManager): Promise<User | null>;
  abstract create(data: CreateUserData, entityManager?: EntityManager): Promise<User>;
  abstract update(id: string, data: Partial<User>, entityManager?: EntityManager): Promise<User>;
  abstract delete(id: string, entityManager?: EntityManager): Promise<void>;
}
```

### 2. Implémentation Repository

```typescript
// repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BaseRepository } from '@common/database';
import { User } from '../entity/user.entity';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserRepository extends BaseRepository implements IUserRepository {
  private userRepo(entityManager?: EntityManager) {
    return this.getRepository(User, entityManager);
  }

  async findById(id: string, entityManager?: EntityManager): Promise<User | null> {
    return this.userRepo(entityManager).findOne({ where: { id } });
  }

  async findByEmail(email: string, entityManager?: EntityManager): Promise<User | null> {
    return this.userRepo(entityManager).findOne({ where: { email } });
  }

  async create(data: CreateUserData, entityManager?: EntityManager): Promise<User> {
    const repo = this.userRepo(entityManager);
    const user = repo.create(data);
    return repo.save(user);
  }

  async update(id: string, data: Partial<User>, entityManager?: EntityManager): Promise<User> {
    const repo = this.userRepo(entityManager);
    await repo.update(id, data);
    const updated = await this.findById(id, entityManager);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async delete(id: string, entityManager?: EntityManager): Promise<void> {
    await this.userRepo(entityManager).delete(id);
  }
}
```

### 3. Provider

```typescript
// repositories/user.repository.provider.ts
import { Provider } from '@nestjs/common';
import { IUserRepository } from './user.repository.interface';
import { UserRepository } from './user.repository';

export const userRepositoryProvider: Provider = {
  provide: IUserRepository,
  useClass: UserRepository,
};
```

### 4. Service

```typescript
// user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from './repositories';

@Injectable()
export class UserService {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
  ) {}

  async getUserById(id: string) {
    return this.userRepo.findById(id);
  }

  async createUser(email: string, password: string) {
    // Logique métier ici (validation, hashing, etc.)
    return this.userRepo.create({ email, passwordHash: hashedPassword });
  }
}
```

### 5. Module

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { userRepositoryProvider } from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, userRepositoryProvider],
  exports: [UserService],
})
export class UserModule {}
```

## Transactions

Pour exécuter des opérations dans une transaction :

```typescript
// Dans le service
async createUserWithProfile(data: CreateUserDto) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();
  
  try {
    // Passer entityManager pour exécuter dans la transaction
    const user = await this.userRepo.create(data, queryRunner.manager);
    const profile = await this.profileRepo.create(
      { userId: user.id, ...data.profile },
      queryRunner.manager
    );
    
    await queryRunner.commitTransaction();
    return { user, profile };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

## Bénéfices

1. **Découplage** : Le service n'est pas lié à TypeORM, facilite le changement d'ORM
2. **Testabilité** : Les repositories peuvent être facilement mockés dans les tests
3. **Maintenabilité** : Séparation claire des responsabilités
4. **Réutilisabilité** : Les repositories peuvent être réutilisés dans différents services
5. **Single Responsibility** : Chaque couche a une responsabilité unique

## Règles strictes

- ❌ **JAMAIS** d'injection directe de `Repository<Entity>` dans un service
- ❌ **JAMAIS** de logique métier dans un repository
- ❌ **JAMAIS** de requêtes SQL directes dans un service (sauf cas exceptionnels)
- ✅ **TOUJOURS** injecter via l'interface (`@Inject(IXxxRepository)`)
- ✅ **TOUJOURS** supporter les transactions via `EntityManager` optionnel
- ✅ **TOUJOURS** hériter de `BaseRepository` pour les repositories
