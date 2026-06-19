import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('AUTH_GOOGLE_ENABLED') !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
