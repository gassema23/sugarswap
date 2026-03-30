import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'not-configured',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
      callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:3001/api/auth/google/callback',
      scope: ['profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const user = await this.authService.findOrCreate({
      socialId: profile.id,
      provider: 'google',
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value ?? null,
    });
    done(null, user);
  }
}
