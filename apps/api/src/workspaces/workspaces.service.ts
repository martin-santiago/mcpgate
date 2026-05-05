import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async create(name: string, ownerId: string): Promise<Workspace> {
    const workspace = this.workspaceRepo.create({ name, ownerId });
    return this.workspaceRepo.save(workspace);
  }

  async findAllByUser(userId: string): Promise<Workspace[]> {
    return this.workspaceRepo.find({ where: { ownerId: userId } });
  }

  async findOne(id: string, userId: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.ownerId !== userId) throw new ForbiddenException();
    return workspace;
  }
}
