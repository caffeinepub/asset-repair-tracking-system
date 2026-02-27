# Specification

## Summary
**Goal:** Fix broken admin authorization by implementing proper principal-based RBAC in the backend and ensuring the frontend passes authenticated principals for all user management operations.

**Planned changes:**
- Backend: Store the first registered Internet Identity principal as admin in stable state; remove all hardcoded principal or password-based admin checks.
- Backend: All admin-protected functions (createUser, deleteUser, updateUser) check caller principal against the stored admin principal list.
- Backend: Add `grantAdmin(principal)` and `revokeAdmin(principal)` functions callable only by existing admins.
- Backend: Add `getMyRole()` query that returns the caller's role based on their principal.
- Frontend: Update all user management mutations in `useQueries.ts`, `SettingsPage.tsx`, `CreateUserDialog.tsx`, and `EditUserDialog.tsx` to use the authenticated actor (not anonymous) when invoking backend functions.
- Frontend: Call `getMyRole()` after login to verify the user's actual role from the backend and drive the admin badge and admin-only UI visibility.
- Frontend: Add role management controls (promote/demote admin) in SettingsPage, visible only to admins.
- Generate `migration.mo` to preserve existing stable state when upgrading the backend schema.

**User-visible outcome:** After signing in with Internet Identity, the first registered user is automatically recognized as admin and can create, edit, and delete users without receiving "Unauthorized" errors. Admins can also promote or demote other users to/from the admin role directly from the Settings page, and the admin badge and admin-only UI sections reflect the principal-verified role.
