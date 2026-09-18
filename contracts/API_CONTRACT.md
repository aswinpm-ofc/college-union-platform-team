# Shared API Contract

Frontend and backend teams use these logical contracts. The backend may implement simple ones through the Supabase SDK/data API and complex/privileged ones through Edge Functions.

## Academics
GET /api/academics/departments
GET /api/academics/departments/{id}/semesters
GET /api/academics/semesters/{id}/subjects
GET /api/academics/materials
POST /api/academics/materials
GET /api/academics/materials/{id}/download
GET /api/academics/my-uploads
POST /api/academics/materials/{id}/report

## Academic Maintainer
GET /api/maintainer/academics/pending
GET /api/maintainer/academics/reports
POST /api/maintainer/academics/{id}/approve
POST /api/maintainer/academics/{id}/reject
POST /api/maintainer/academics/{id}/unpublish

## Student Welfare
GET /api/welfare
GET /api/welfare/{id}
POST /api/admin/welfare
PATCH /api/admin/welfare/{id}
POST /api/admin/welfare/{id}/publish
POST /api/admin/welfare/{id}/archive

## Events
GET /api/events
GET /api/events/{id}
POST /api/events/{id}/register
DELETE /api/events/{id}/register

## Grievances
POST /api/grievances
GET /api/grievances/mine
GET /api/grievances/{id}
PATCH /api/grievances/{id}/status

## Notifications
GET /api/notifications
POST /api/notifications/{id}/read
POST /api/notifications/read-all
PATCH /api/notification-preferences
POST /api/devices/register

## Blood Bank
GET /api/blood-bank/donors
POST /api/blood-bank/donors/register
GET /api/blood-bank/requests
POST /api/blood-bank/requests
PATCH /api/blood-bank/requests/{id}/status
GET /api/blood-bank/helplines

