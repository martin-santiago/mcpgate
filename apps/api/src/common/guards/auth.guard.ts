import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const LOCAL_CLI_USER = {
  email: 'local@mcpgate.dev',
  id: 'local-cli-user',
  role: 'owner',
};

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('supabase') {
  canActivate(context: ExecutionContext) {
    if (process.env.MCPGATE_LOCAL_MODE === 'true') {
      const request = context.switchToHttp().getRequest();
      request.user = LOCAL_CLI_USER;
      return true;
    }

    return super.canActivate(context);
  }
}
