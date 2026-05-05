import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { SupabaseAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';
import { IsString, MinLength } from 'class-validator';

class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  name: string;
}

@UseGuards(SupabaseAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.workspacesService.create(dto.name, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserType) {
    return this.workspacesService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.workspacesService.findOne(id, user.id);
  }
}
