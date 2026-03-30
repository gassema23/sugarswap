import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export interface OAuthUserDto {
  socialId: string;
  provider: string;
  name: string;
  avatar: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Upsert a user from an OAuth profile — never creates email/password accounts. */
  async findOrCreate(dto: OAuthUserDto): Promise<User> {
    return this.prisma.user.upsert({
      where: { socialId_provider: { socialId: dto.socialId, provider: dto.provider } },
      create: {
        socialId: dto.socialId,
        provider: dto.provider,
        name: dto.name,
        avatar: dto.avatar,
      },
      update: {
        name: dto.name,
        avatar: dto.avatar,
      },
    });
  }

  /** Sign a JWT for an authenticated user. */
  login(user: User): { accessToken: string } {
    return {
      accessToken: this.jwt.sign({ sub: user.id, name: user.name }),
    };
  }
}
