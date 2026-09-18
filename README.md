# College Union Platform — Team Ready

```text
college-union-platform/
├── frontend/      # Shared React/Vite app for all teams
├── backend/       # Shared Supabase backend + Edge Function starters
├── contracts/     # Shared API contracts for all modules
├── docs/          # Team workflow and assignment rules
└── README.md      # Project overview
```

## Team model
This project is designed for multiple students to work in parallel on separate feature pages without building disconnected apps.

- One shared frontend app
- One shared backend project
- Each student or team owns one feature area
- Each feature has a clear page, API contract, and backend responsibility
- Shared-routing, layouts, and core UI stay under central ownership

## Frontend ownership
Students work inside `frontend/src/features/<module>/`.
Examples:
- `home`
- `events`
- `grievances`
- `blood-bank`
- `academics`
- `notifications`
- `profile`
- `admin`

## Backend ownership
Backend work happens inside `backend/supabase/` and follows the contracts in `contracts/API_CONTRACT.md`.
Each feature team must keep its API shape consistent with the documented contract.

## Core team responsibilities
The core/integration team owns:
- App shell and routing
- shared layouts and shared UI components
- environment variables
- API contract versioning
- merge review for cross-feature changes

## Workflow
1. Pick a feature folder and corresponding contract.
2. Create or work on your own feature branch.
3. Build only your module page and API use cases.
4. Keep a clear interface contract with the backend.
5. Submit a PR only after your feature is tested in the shared app.

## Run frontend
```powershell
cd frontend
npm install
npm run dev
```

## Important
The frontend is demo-only until the real backend is connected. The backend starter should be treated as a shared service layer, not as isolated student projects.

---

# Student Team Workflow

This project is meant to be worked on as one shared app by multiple students.

## Team model

- one shared frontend app
- one shared backend project
- many feature owners
- one shared API contract

Each student should work on a feature page or module instead of creating a separate app.

## Working structure

```text
college-union-platform/
├── frontend/
│   └── src/features/
│       ├── home/
│       ├── events/
│       ├── academics/
│       ├── grievances/
│       ├── admin/
│       └── ...
├── backend/
│   └── supabase/
├── contracts/
│   └── API_CONTRACT.md
├── docs/
├── README.md
├── STUDENT_WORKFLOW.md
└── .gitignore
```

## Student roles

Feature teams may own:
- Home
- Events and announcements
- Grievances
- Blood bank
- Academics
- Student welfare
- Notifications
- Admin and profile

## Branching rule

Every student should work from their own feature branch:

```bash
git checkout -b feature/home
git checkout -b feature/events
git checkout -b feature/academics
git checkout -b feature/grievances
```

## Rules

- Keep work inside your assigned feature folder.
- Never edit unrelated feature pages without approval.
- Keep shared routes and layouts under core-team control.
- Match the API contract in `contracts/API_CONTRACT.md`.
- Open a pull request before merging into `main`.

## Review checklist

Before a PR is merged, confirm:
- the feature works in the shared app
- no unrelated files were changed
- API usage follows the contract
- the branch is up to date with `main`


