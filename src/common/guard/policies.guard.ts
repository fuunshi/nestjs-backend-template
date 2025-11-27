import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import {
  CaslAbilityFactory,
  AppAbility,
} from '../modules/casl/casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  RequiredRule,
} from '../decorators/policies.decorator';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    role: string;
  };
}

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<RequiredRule[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    // If no policies defined, allow access
    if (policyHandlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = this.caslAbilityFactory.createForUser({
      id: user.userId,
      role: user.role as any,
    });

    const hasPermission = policyHandlers.every((rule) =>
      this.execPolicyHandler(rule, ability),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }

  private execPolicyHandler(rule: RequiredRule, ability: AppAbility): boolean {
    return ability.can(rule.action, rule.subject);
  }
}
