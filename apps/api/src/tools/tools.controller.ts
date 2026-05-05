import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { SupabaseAuthGuard } from '../common/guards/auth.guard';
import {
  CurrentUser,
  CurrentUserType,
} from '../common/decorators/current-user.decorator';
import { IsBoolean, IsArray, IsUUID } from 'class-validator';

class ToggleToolDto {
  @IsBoolean()
  isActive: boolean;
}

class BatchToggleDto {
  @IsArray()
  @IsUUID('4', { each: true })
  toolIds: string[];

  @IsBoolean()
  isActive: boolean;
}

@UseGuards(SupabaseAuthGuard)
@Controller('workspaces/:workspaceId/tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.toolsService.findAll(workspaceId);
  }

  @Patch(':id')
  toggle(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: ToggleToolDto,
  ) {
    return this.toolsService.toggleActive(id, workspaceId, dto.isActive);
  }

  @Post('batch-toggle')
  batchToggle(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: BatchToggleDto,
  ) {
    return this.toolsService.batchToggle(
      workspaceId,
      dto.toolIds,
      dto.isActive,
    );
  }
}
