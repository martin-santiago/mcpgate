import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SourceType = 'custom' | 'supabase' | 'slack' | 'grafana';
export type SourceStatus = 'connected' | 'disconnected' | 'error' | 'pending';

@Entity('sources')
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: SourceType;

  @Column({ type: 'varchar', default: 'pending' })
  status: SourceStatus;

  @Column({ type: 'simple-json', nullable: true })
  config: Record<string, unknown>;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'last_connected_at' })
  lastConnectedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
