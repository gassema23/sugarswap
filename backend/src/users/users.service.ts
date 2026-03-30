import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { badges: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    const { socialId: _s, ...profile } = user;
    return profile;
  }
}
