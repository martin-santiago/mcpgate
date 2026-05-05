import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SupabaseAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';
import { IsString, IsIn, IsObject, IsOptional } from 'class-validator';
import type { SourceType } from './source.entity';

class CreateSourceDto {
  @IsString()
  name: string;

  @IsIn(['custom', 'supabase', 'slack', 'grafana'])
  type: SourceType;

  @IsObject()
  @IsOptional()
  config: Record<string, unknown>;
}

@UseGuards(SupabaseAuthGuard)
@Controller('workspaces/:workspaceId/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSourceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sourcesService.create(
      workspaceId,
      user.id,
      dto.name,
      dto.type,
      dto.config ?? {},
    );
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sourcesService.findAll(workspaceId, user.id);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sourcesService.findOne(id, workspaceId, user.id);
  }

  @Post(':id/test')
  testConnection(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sourcesService.testConnection(id, workspaceId, user.id);
  }

  @Post(':id/discover-tools')
  discoverTools(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sourcesService.discoverTools(id, workspaceId, user.id);
  }
}
