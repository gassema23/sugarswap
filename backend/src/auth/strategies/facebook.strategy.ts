import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID:     process.env.FACEBOOK_APP_ID      || 'not-configured',
      clientSecret: process.env.FACEBOOK_APP_SECRET  || 'not-configured',
      callbackURL:  process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'picture.type(large)'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const user = await this.authService.findOrCreate({
      socialId: profile.id,
      provider: 'facebook',
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value ?? null,
    });
    done(null, user);
  }
}
