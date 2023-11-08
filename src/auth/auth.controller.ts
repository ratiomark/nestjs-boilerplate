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

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SerializeOptions({
    groups: ['ME'],
  })
  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  public login(
    @Body() loginDto: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDto);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  // @HttpCode(HttpStatus.NO_CONTENT)
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
  ): Promise<void | { hash: string }> {
    return this.authService.register(createUserDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  // @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void | { email_confirmed: boolean }> {
    return this.authService.confirmEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description:
      'This endpoint requires a Bearer token to be passed in the header.',
  })
  @SerializeOptions({
    groups: ['ME'],
  })
  @Get('me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  public me(
    @Request() request,
    // @Headers() headers,
  ): Promise<NullableType<User>> {
    // console.log('headers   ', headers);
    return this.authService.me(request.user);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get token, refresh token and token expiration date',
    description:
      'This endpoint requires a Bearer token(refresh token) to be passed in the header.',
  })
  @SerializeOptions({
    groups: ['ME'],
  })
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  public refresh(@Request() request): Promise<Omit<LoginResponseType, 'user'>> {
    return this.authService.refreshToken({
      sessionId: request.user.sessionId,
      // sessionId: request.user.sessionId,
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(JwtGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  @HttpCode(HttpStatus.OK)
  public async logout(@Request() request): Promise<void | GetBatchResult> {
    return await this.authService.logout({
      sessionId: request.user.sessionId,
    });
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['ME'],
  })
  @Patch('me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    console.log('request.user', request.user);
    console.log('userDto', userDto);

    return this.authService.update(request.user, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Request() request): Promise<void> {
    return this.authService.softDelete(request.user);
  }
}
