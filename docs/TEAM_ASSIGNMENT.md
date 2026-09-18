# Team Assignment

## Shared project rule
This app is built as one shared frontend plus one shared backend project so each student can work independently on a feature page without creating a separate app or repo.

## Frontend feature ownership
Each student or team owns one feature folder under `frontend/src/features/`.

- Home
- Events and announcements
- Grievances
- Blood bank
- Academics
- Academic maintainer
- Student welfare
- Emergency
- Magazine
- University map
- Notifications
- Auth and profile
- Admin

## Backend feature ownership
Each backend team owns one domain in `backend/supabase/` and follows the API contract defined in `contracts/API_CONTRACT.md`.

- Auth
- Database schema and migrations
- Academics and materials
- Maintainer moderation
- Welfare features
- Events and registrations
- Grievances
- Blood bank
- Notifications
- Storage and file handling
- Security and RLS checks

## Core / integration ownership
The core team owns shared parts that all students depend on:
- `frontend/src/App.jsx`
- `frontend/src/routes.jsx`
- `frontend/src/layouts/`
- shared UI in `frontend/src/components/`
- environment variables and runtime config
- migration coordination
- final repository integration and review

## Branching workflow
Use a separate branch per feature or student task.

Example:
- `feature/home`
- `feature/events`
- `feature/grievances`
- `feature/academics`
- `feature/admin`

## Merge rules
- Feature work should normally stay inside its own folder.
- Shared-core changes must be reviewed before merge.
- Each feature must match the shared contract in `contracts/API_CONTRACT.md`.
- Avoid direct edits to routes or shared layout components unless required and reviewed.

## Why this works
This model allows parallel student work while keeping one unified app. Every student is responsible for a page and a connected backend contract rather than a separate app, so the whole project remains integrated and reviewable.
