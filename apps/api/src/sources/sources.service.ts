import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Source, SourceType } from './source.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ToolsService } from '../tools/tools.service';

type DiscoveredTool = {
  description?: string;
  inputSchema?: Record<string, unknown>;
  name: string;
};

function normalizeToolName(rawToolName: string): string {
  return rawToolName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getPlaceholderToolsForSourceType(
  sourceType: SourceType,
): DiscoveredTool[] {
  if (sourceType === 'supabase') {
    return [
      {
        description: 'Placeholder tool for listing tables',
        name: 'list_tables',
      },
    ];
  }

  if (sourceType === 'slack') {
    return [
      {
        description: 'Placeholder tool for listing channels',
        name: 'list_channels',
      },
    ];
  }

  if (sourceType === 'grafana') {
    return [
      {
        description: 'Placeholder tool for listing dashboards',
        name: 'list_dashboards',
      },
    ];
  }

  return [
    {
      description: 'Checks whether the upstream source is reachable',
      name: 'check_connection',
    },
    {
      description: 'Returns basic source status information',
      name: 'fetch_status',
    },
  ];
}

function getDiscoveredToolsFromConfig(source: Source): DiscoveredTool[] {
  const mockTools = source.config?.mockTools;

  if (Array.isArray(mockTools)) {
    const normalizedTools = mockTools
      .map((tool): DiscoveredTool | null => {
        if (typeof tool === 'string') {
          const normalizedName = normalizeToolName(tool);
          return normalizedName ? { name: normalizedName } : null;
        }

        if (
          typeof tool === 'object' &&
          tool !== null &&
          typeof tool.name === 'string'
        ) {
          const normalizedName = normalizeToolName(tool.name);
          if (!normalizedName) return null;

          return {
            description:
              typeof tool.description === 'string'
                ? tool.description
                : undefined,
            inputSchema:
              typeof tool.inputSchema === 'object' && tool.inputSchema !== null
                ? (tool.inputSchema as Record<string, unknown>)
                : undefined,
            name: normalizedName,
          };
        }

        return null;
      })
      .filter((tool): tool is DiscoveredTool => tool !== null);

    if (normalizedTools.length > 0) return normalizedTools;
  }

  return getPlaceholderToolsForSourceType(source.type);
}

@Injectable()
export class SourcesService {
  constructor(
    @InjectRepository(Source)
    private readonly sourceRepo: Repository<Source>,
    private readonly workspacesService: WorkspacesService,
    private readonly toolsService: ToolsService,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    name: string,
    type: SourceType,
    config: Record<string, unknown>,
  ): Promise<Source> {
    await this.workspacesService.findOne(workspaceId, userId);
    const source = this.sourceRepo.create({ workspaceId, name, type, config });
    return this.sourceRepo.save(source);
  }

  async findAll(workspaceId: string, userId: string): Promise<Source[]> {
    await this.workspacesService.findOne(workspaceId, userId);
    return this.sourceRepo.find({ where: { workspaceId } });
  }

  async findOne(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<Source> {
    await this.workspacesService.findOne(workspaceId, userId);
    const source = await this.sourceRepo.findOne({
      where: { id, workspaceId },
    });
    if (!source) throw new NotFoundException('Source not found');
    return source;
  }

  async testConnection(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const source = await this.findOne(id, workspaceId, userId);

    try {
      if (source.type === 'custom') {
        const url = source.config?.url as string;
        if (!url) return { ok: false, message: 'Missing url in config' };

        const res = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok)
          return { ok: false, message: `Responded with status ${res.status}` };

        await this.sourceRepo.update(id, {
          status: 'connected',
          lastConnectedAt: new Date(),
          lastError: null,
        });
        return { ok: true, message: 'Connection successful' };
      }

      return {
        ok: false,
        message: `Test not implemented for type ${source.type}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.sourceRepo.update(id, { status: 'error', lastError: message });
      return { ok: false, message };
    }
  }

  async discoverTools(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<{
    count: number;
    message: string;
    tools: { id: string; name: string; toolKey: string }[];
  }> {
    const source = await this.findOne(id, workspaceId, userId);
    const discoveredTools = getDiscoveredToolsFromConfig(source);
    const syncedTools = await this.toolsService.syncToolsForSource(
      source.id,
      workspaceId,
      discoveredTools,
    );

    return {
      count: syncedTools.length,
      message: `Discovered ${syncedTools.length} tools for ${source.name}`,
      tools: syncedTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        toolKey: tool.toolKey,
      })),
    };
  }
}
