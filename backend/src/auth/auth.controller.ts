import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro de usuário da clínica' })
  register(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: RegisterDto,
  ) {
    return this.service.register(tenantId, dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login com email/senha' })
  login(@Headers('x-tenant-id') tenantId: string, @Body() dto: LoginDto) {
    return this.service.login(tenantId, dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token com refresh token' })
  refresh(@CurrentUser() user: AuthUser, @Body() dto: RefreshTokenDto) {
    return this.service.refresh(user.tenantId, user.sub, dto);
  }
}
