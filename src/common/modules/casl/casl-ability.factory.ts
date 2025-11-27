import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

// Define actions
export enum Action {
  Manage = 'manage', // Wildcard for any action
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  // Custom actions
  Approve = 'approve',
  Reject = 'reject',
  Publish = 'publish',
  Archive = 'archive',
  Restore = 'restore',
  Export = 'export',
  Import = 'import',
  Impersonate = 'impersonate',
}

// Define subjects (entities)
export type Subjects =
  | 'User'
  | 'UserProfile'
  | 'Token'
  | 'LoginHistory'
  | 'AuditLog'
  | 'RequestLog'
  | 'all';

export type AppAbility = PureAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: { id: string; role: Role }) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );

    switch (user.role) {
      case Role.SUPER_ADMIN:
        // Super Admin can do anything
        can(Action.Manage, 'all');
        break;

      case Role.ADMIN:
        // Admin can manage most things
        can(Action.Manage, 'User');
        can(Action.Manage, 'UserProfile');
        can(Action.Read, 'AuditLog');
        can(Action.Read, 'RequestLog');
        can(Action.Read, 'LoginHistory');
        can(Action.Manage, 'Token');
        // Cannot manage other admins
        cannot(Action.Delete, 'User', { role: Role.SUPER_ADMIN });
        cannot(Action.Update, 'User', { role: Role.SUPER_ADMIN });
        break;

      case Role.MODERATOR:
        // Moderator can read and update users, but not delete
        can(Action.Read, 'User');
        can(Action.Update, 'User');
        can(Action.Read, 'UserProfile');
        can(Action.Update, 'UserProfile');
        can(Action.Read, 'LoginHistory');
        cannot(Action.Delete, 'User');
        cannot(Action.Create, 'User');
        break;

      case Role.USER:
      default:
        // Regular users can only manage their own data
        can(Action.Read, 'User', { id: user.id });
        can(Action.Update, 'User', { id: user.id });
        can(Action.Read, 'UserProfile', { userId: user.id });
        can(Action.Update, 'UserProfile', { userId: user.id });
        can(Action.Read, 'LoginHistory', { userId: user.id });
        can(Action.Read, 'Token', { userId: user.id });
        can(Action.Delete, 'Token', { userId: user.id }); // Can revoke own tokens
        break;
    }

    return build();
  }
}
