import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ToolCapability = 'read' | 'write' | 'admin' | 'unknown';

@Entity('tools')
export class Tool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'tool_key' })
  toolKey: string;

  @Column({ type: 'varchar', default: 'unknown' })
  capability: ToolCapability;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'input_schema' })
  inputSchema: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
