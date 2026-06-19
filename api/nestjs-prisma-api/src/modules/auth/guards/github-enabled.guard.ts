import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('AUTH_GITHUB_ENABLED') !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
