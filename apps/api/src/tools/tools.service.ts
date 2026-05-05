import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool, ToolCapability } from './tool.entity';

const READ_PREFIXES = [
  'get',
  'list',
  'read',
  'fetch',
  'search',
  'find',
  'describe',
  'show',
];
const WRITE_PREFIXES = [
  'create',
  'update',
  'delete',
  'remove',
  'send',
  'post',
  'patch',
  'set',
  'insert',
];
const ADMIN_PREFIXES = [
  'admin',
  'manage',
  'configure',
  'deploy',
  'reset',
  'purge',
];

function classifyCapability(toolName: string): ToolCapability {
  const lower = toolName.toLowerCase();
  if (
    ADMIN_PREFIXES.some((p) => lower.startsWith(p) || lower.includes(`_${p}`))
  )
    return 'admin';
  if (
    WRITE_PREFIXES.some((p) => lower.startsWith(p) || lower.includes(`_${p}`))
  )
    return 'write';
  if (READ_PREFIXES.some((p) => lower.startsWith(p) || lower.includes(`_${p}`)))
    return 'read';
  return 'unknown';
}

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private readonly toolRepo: Repository<Tool>,
  ) {}

  async syncToolsForSource(
    sourceId: string,
    workspaceId: string,
    discoveredTools: {
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }[],
  ): Promise<Tool[]> {
    const existing = await this.toolRepo.find({ where: { sourceId } });
    const existingKeys = new Set(existing.map((t) => t.toolKey));

    const toCreate = discoveredTools
      .filter((t) => !existingKeys.has(`${sourceId}:${t.name}`))
      .map((t) =>
        this.toolRepo.create({
          sourceId,
          workspaceId,
          name: t.name,
          description: t.description ?? '',
          toolKey: `${sourceId}:${t.name}`,
          capability: classifyCapability(t.name),
          inputSchema: t.inputSchema ?? null,
          isActive: true,
        }),
      );

    if (toCreate.length > 0) await this.toolRepo.save(toCreate);
    return this.toolRepo.find({ where: { sourceId } });
  }

  async findAll(workspaceId: string): Promise<Tool[]> {
    return this.toolRepo.find({ where: { workspaceId } });
  }

  async findBySource(sourceId: string, workspaceId: string): Promise<Tool[]> {
    return this.toolRepo.find({ where: { sourceId, workspaceId } });
  }

  async toggleActive(
    id: string,
    workspaceId: string,
    isActive: boolean,
  ): Promise<Tool> {
    const tool = await this.toolRepo.findOne({ where: { id, workspaceId } });
    if (!tool) throw new NotFoundException('Tool not found');
    tool.isActive = isActive;
    return this.toolRepo.save(tool);
  }

  async batchToggle(
    workspaceId: string,
    toolIds: string[],
    isActive: boolean,
  ): Promise<{ updated: number }> {
    const result = await this.toolRepo
      .createQueryBuilder()
      .update(Tool)
      .set({ isActive })
      .where('id IN (:...ids) AND workspace_id = :workspaceId', {
        ids: toolIds,
        workspaceId,
      })
      .execute();
    return { updated: result.affected ?? 0 };
  }
}
