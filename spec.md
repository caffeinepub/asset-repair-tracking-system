# Specification

## Summary
**Goal:** Add username/password login authentication, role-based access control, and admin user management to the Asset Repair Tracker.

**Planned changes:**
- Add an `AppUser` data model to the backend with id, username, passwordHash, and role fields, stored in stable state; seed a default admin account on first deploy
- Expose backend functions: `login`, `getUsers`, `createUser`, `updateUser`, `deleteUser` (management functions restricted to admin callers)
- Replace the Internet Identity login screen with a username/password login screen showing the app logo, username field, password field, and Sign In button
- Store the logged-in user (id, username, role) in React context accessible app-wide
- Add a Settings page visible and accessible only to admin users, with a Settings link in the sidebar shown only to admins
- Build a User Management section on the Settings page with a table of users, and dialogs to create, edit, and delete users (with confirmation); prevent self-deletion
- Update the Header to show the logged-in user's username and role badge, and replace the Internet Identity logout with a session-clearing logout
- Gate all admin-only UI elements (add/edit/delete buttons across Assets, Parts Inventory, Repair Tickets pages) based on the new role from the username/password session

**User-visible outcome:** Users log in with a username and password. Admins see a Settings page where they can manage users (create, edit, delete). Regular users can view data but cannot create, edit, or delete records, and cannot access the Settings page.
