import { SetMetadata } from '@nestjs/common';
import { Action, Subjects } from '../modules/casl/casl-ability.factory';

export interface RequiredRule {
  action: Action;
  subject: Subjects;
}

export const CHECK_POLICIES_KEY = 'check_policies';

/**
 * Decorator to check if user has permission to perform an action on a subject
 * @param action The action to perform (e.g., Action.Read, Action.Create)
 * @param subject The subject/entity to perform the action on (e.g., 'User', 'UserProfile')
 */
export const CheckPolicies = (...requirements: RequiredRule[]) =>
  SetMetadata(CHECK_POLICIES_KEY, requirements);

/**
 * Shorthand decorator for read permission
 */
export const CanRead = (subject: Subjects) =>
  CheckPolicies({ action: Action.Read, subject });

/**
 * Shorthand decorator for create permission
 */
export const CanCreate = (subject: Subjects) =>
  CheckPolicies({ action: Action.Create, subject });

/**
 * Shorthand decorator for update permission
 */
export const CanUpdate = (subject: Subjects) =>
  CheckPolicies({ action: Action.Update, subject });

/**
 * Shorthand decorator for delete permission
 */
export const CanDelete = (subject: Subjects) =>
  CheckPolicies({ action: Action.Delete, subject });

/**
 * Shorthand decorator for manage (all actions) permission
 */
export const CanManage = (subject: Subjects) =>
  CheckPolicies({ action: Action.Manage, subject });
