import {
  Body,
  Controller,
  // Headers,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  UseGuards,
  Patch,
  Delete,
  SerializeOptions,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
// import { AuthGuard } from '@nestjs/passport';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { LoginResponseType } from './types/login-response.type';
import { User } from '@prisma/client';
import { NullableType } from '../utils/types/nullable.type';
import { GetBatchResult } from '@prisma/client/runtime/library';
import { JwtGuard, JwtRefreshGuard } from 'src/common/guargs';
import { GetCurrentUser, IsPublic } from 'src/common/decorators';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['ME'],
  })
  @IsPublic()
  public login(
    @Body() loginDto: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDto);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  @IsPublic()
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
  ): Promise<void | { hash: string }> {
    return this.authService.register(createUserDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void | { email_confirmed: boolean }> {
    return this.authService.confirmEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description:
      'This endpoint requires a Bearer token to be passed in the header.',
  })
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['ME'],
  })
  public me(
    @GetCurrentUser('id') userId: User['id'],
  ): Promise<NullableType<User>> {
    return this.authService.me(userId);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get access token, refresh token and token expiration date',
    description:
      'This endpoint requires a Bearer token(refresh token) to be passed in the header.',
  })
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['ME'],
  })
  @IsPublic()
  @UseGuards(JwtRefreshGuard)
  public refresh(
    @GetCurrentUser('sessionId') sessionId: number,
  ): Promise<Omit<LoginResponseType, 'user'>> {
    return this.authService.refreshToken(sessionId);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  public async logout(
    @GetCurrentUser('sessionId') sessionId: number,
  ): Promise<void | GetBatchResult> {
    return await this.authService.logout(sessionId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['ME'],
  })
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    return this.authService.update(request.user, userDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  public async delete(@Request() request): Promise<void> {
    return this.authService.softDelete(request.user);
  }
}
