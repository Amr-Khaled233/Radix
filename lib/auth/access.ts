import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Roles for the Better Auth admin plugin. Only `super_admin` may use the
 * plugin's user-management endpoints. Application permissions (content,
 * settings, inbox…) live in ./permissions.ts.
 */
export const ac = createAccessControl(defaultStatements);

export const superAdminRole = ac.newRole({ ...adminAc.statements });
export const adminRole = ac.newRole({ user: [], session: [] });
export const editorRole = ac.newRole({ user: [], session: [] });

export const authRoles = {
  super_admin: superAdminRole,
  admin: adminRole,
  editor: editorRole,
};
