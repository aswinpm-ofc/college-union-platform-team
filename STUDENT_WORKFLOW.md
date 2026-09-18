# Student Team Workflow

This guide explains how students should work together on the same repository without creating separate apps.

## Project model

This project is structured as:
- one shared frontend app
- one shared backend project
- multiple feature owners
- one shared API contract

Students should work on different feature pages or modules, not separate standalone projects.

## Repository structure

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

## Team roles

### 1. Core/integration team
Responsible for:
- app shell
- routing
- shared layouts
- shared UI components
- environment variables
- final review and merges

### 2. Feature teams
Each student or group owns one feature area such as:
- Home
- Events
- Academics
- Grievances
- Blood Bank
- Notifications
- Emergency
- Admin/Profile

## Branching rules

Every student should create their own feature branch before making changes.

Examples:
```bash
git checkout -b feature/home
git checkout -b feature/events
git checkout -b feature/academics
git checkout -b feature/grievances
git checkout -b feature/admin
```

## Working rules

- Do not edit unrelated feature folders.
- Do not change shared routes or layouts unless approved.
- Keep each feature inside its own folder.
- Match the API contract in `contracts/API_CONTRACT.md`.
- Commit small, clear changes.
- Open a pull request before merging into `main`.

## Pull request checklist

Before opening a PR, confirm:
- the feature works in the shared app
- the UI matches the module requirement
- no unrelated files were changed
- the API usage follows the contract
- the branch is updated with the latest `main`

## Feature ownership examples

| Feature | Owner role |
|---|---|
| Home | Landing page + navigation |
| Events | Event listings and registration |
| Academics | Study material upload and browsing |
| Grievances | Complaint form and status |
| Blood Bank | Donation/request listing |
| Admin | User and system dashboard |
| Notifications | Alerts and notification panel |
| Profile | Student profile and account info |

## Backend rule

Backend work should follow the same feature ownership model. Each backend feature should map to the API contract. If a frontend feature needs data, the contract must be followed exactly.

## Team communication rule

If a student changes a shared file or shared route, they should:
- tell the core team
- explain the reason
- update the API or contract if needed
- request a review before merging

## Final result

The project should remain:
- one repository
- one frontend app
- one shared backend
- many student-owned feature branches
- clean team-based integration
