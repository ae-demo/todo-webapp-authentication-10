# Todo Webapp with Authentication — PRD

## Problem Statement

People jot down tasks in scattered places — sticky notes, chat threads, other
apps — and lose track of them or lose them entirely when a device is wiped or
a browser tab closes. Without a personal, durable place to keep a todo list,
tasks fall through the cracks and there is no single place to check what is
still outstanding.

## Solution

A simple todo web application where each person signs in with their own
account and keeps a personal list of tasks. Every todo a user adds is saved to
a database, so the list is exactly as the user left it the next time they sign
in, from any device.

## Actors

- **User** — a signed-in individual who manages their own personal todo list:
adding, viewing, completing, editing, and deleting their own todo entries.
No user can see or affect another user's todos.

## User Stories

1. As a User, I want to sign in to the app, so that my todo list is mine alone and saved under my account.
2. As a User, I want to add a new todo with a title, so that I can capture a task I need to do.
3. As a User, I want to see all of my todos in one list, so that I can review everything I still need to do.
4. As a User, I want to mark a todo as completed (and unmark it), so that I can track what's done versus outstanding.
5. As a User, I want to edit the title of an existing todo, so that I can fix a typo or update what the task means.
6. As a User, I want to delete a todo, so that I can remove tasks I no longer need.
7. As a User, I want my todos to persist across sessions and devices, so that signing in anywhere shows me the same up-to-date list.

## Product Decisions

- **Sign-in**: users authenticate via SSO through Thunder, the platform identity provider — every web app in this organization signs users in this way (org default).
- **Persistence**: todo entries are stored in a database so they survive sign-out, browser restarts, and device changes.
- **Todo shape**: a todo has a title and a completed/not-completed status only — no due date, priority, or other fields *assumed*.
- **Organization**: each user has a single flat list of todos — no named lists or categories *assumed*.
- **Scope of ownership**: a user can only ever see and modify their own todos — there is no sharing or admin oversight of other users' lists.
- **External services**: none are required for this product — authentication is covered by the platform's own Thunder SSO, and no other third-party capability (payments, email, maps, etc.) is part of this scope.

## Out of Scope

- Due dates, reminders, priority levels, tags, or categories on todos.
- Multiple named lists per user.
- Sharing a todo list with, or assigning tasks to, another user.
- An admin role or any cross-user visibility/management.
- Notifications (email, push, or otherwise).
- Native mobile apps — this is a web application only.

## Open Questions

*(none — the interview converged on the decisions above)*