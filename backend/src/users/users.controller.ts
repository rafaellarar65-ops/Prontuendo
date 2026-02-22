import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Criar usuário da clínica' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.tenantId, user.sub, dto);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar usuários do tenant' })
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.usersService.findAll(user.tenantId, pagination);
  }

  @Patch(':id')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.tenantId, user.sub, id, dto);
  }

  @Delete(':id')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Remover usuário' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.remove(user.tenantId, user.sub, id);
  }
}
