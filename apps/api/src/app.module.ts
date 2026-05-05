import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseModule } from './supabase.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SourcesModule } from './sources/sources.module';
import { ToolsModule } from './tools/tools.module';
import { Workspace } from './workspaces/workspace.entity';
import { Source } from './sources/source.entity';
import { Tool } from './tools/tool.entity';

function isLocalStorageMode(config: ConfigService): boolean {
  return (
    config.get('MCPGATE_STORAGE_MODE') === 'sqlite' ||
    config.get('MCPGATE_LOCAL_MODE') === 'true'
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.staging',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (isLocalStorageMode(config)) {
          return {
            type: 'sqlite' as const,
            database:
              config.get<string>('MCPGATE_SQLITE_PATH') ||
              '.mcpgate/mcpgate.sqlite',
            entities: [Workspace, Source, Tool],
            synchronize: true,
          };
        }

        return {
          type: 'postgres' as const,
          url: config.getOrThrow('DATABASE_URL'),
          entities: [Workspace, Source, Tool],
          synchronize: true,
          ssl: { rejectUnauthorized: false },
        };
      },
    }),
    SupabaseModule,
    AuthModule,
    WorkspacesModule,
    SourcesModule,
    ToolsModule,
  ],
})
export class AppModule {}
