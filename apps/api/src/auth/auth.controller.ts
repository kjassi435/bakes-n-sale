import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public, CurrentUser, AuthUser } from '../common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/api/auth',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.register(dto);
    res.cookie('refresh_token', r.refreshToken, COOKIE_OPTIONS);
    return { user: r.user, accessToken: r.accessToken };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.login(dto);
    res.cookie('refresh_token', r.refreshToken, COOKIE_OPTIONS);
    return { user: r.user, accessToken: r.accessToken };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.refresh(req.cookies?.refresh_token);
    res.cookie('refresh_token', r.refreshToken, COOKIE_OPTIONS);
    return { user: r.user, accessToken: r.accessToken };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }
}
