# Campus Issue Resolver - Backend Integration Guide

## Overview
This document provides the backend team with all necessary information to connect the Firestore/backend to the existing frontend API calls.

---

## API Endpoints

All endpoints are under the base path `/api/issues`.

### 1. **GET /api/issues** - Fetch All Issues
Retrieves all issues from the database.

**Request:**
```http
GET /api/issues
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": "ISSUE-A001",
    "title": "WiFi Connectivity Issues",
    "description": "Intermittent WiFi in block",
    "category": "IT",
    "location": "Block B",
    "date": "2026-01-15",
    "status": "resolved",
    "submittedBy": "alice",
    "approved": false
  }
]
```

**Response (400/500):**
```json
{
  "error": "Failed to fetch issues",
  "message": "Database connection error"
}
```

---

### 2. **POST /api/issues** - Create Issue
Creates a new issue in the database.

**Request:**
```http
POST /api/issues
Content-Type: application/json

{
  "title": "Broken Water Tap",
  "description": "Tap leaking in bathroom",
  "category": "Facilities",
  "location": "Hostel 1",
  "submittedBy": "john_doe"
}
```

**Response (200/201):**
```json
{
  "id": "ISSUE-A019",
  "title": "Broken Water Tap",
  "description": "Tap leaking in bathroom",
  "category": "Facilities",
  "location": "Hostel 1",
  "date": "2026-02-08T10:30:00Z",
  "status": "pending",
  "submittedBy": "john_doe",
  "approved": false
}
```

**Request Body Type:**
```typescript
interface CreateIssuePayload {
  title: string           // Required
  description?: string    // Optional
  category?: string       // Optional
  location?: string       // Optional
  submittedBy?: string    // Optional
}
```

---

### 3. **POST /api/issues/{id}/approve** - Approve Issue
Marks an issue as approved.

**Request:**
```http
POST /api/issues/ISSUE-A001/approve
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": "ISSUE-A001",
  "title": "WiFi Connectivity Issues",
  "description": "Intermittent WiFi in block",
  "category": "IT",
  "location": "Block B",
  "date": "2026-01-15",
  "status": "resolved",
  "submittedBy": "alice",
  "approved": true
}
```

---

### 4. **POST /api/issues/{id}/resolve** - Resolve Issue
Marks an issue as resolved.

**Request:**
```http
POST /api/issues/ISSUE-A001/resolve
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": "ISSUE-A001",
  "title": "WiFi Connectivity Issues",
  "description": "Intermittent WiFi in block",
  "category": "IT",
  "location": "Block B",
  "date": "2026-01-15",
  "status": "resolved",
  "submittedBy": "alice",
  "approved": true
}
```

---

### 5. **PATCH /api/issues/{id}** - Update Issue Status (Optional)
Generic endpoint to update issue status.

**Request:**
```http
PATCH /api/issues/ISSUE-A001
Content-Type: application/json

{
  "status": "in-progress"
}
```

**Response (200 OK):**
```json
{
  "id": "ISSUE-A001",
  "title": "WiFi Connectivity Issues",
  "description": "Intermittent WiFi in block",
  "category": "IT",
  "location": "Block B",
  "date": "2026-01-15",
  "status": "in-progress",
  "submittedBy": "alice",
  "approved": false
}
```

**Request Body Type:**
```typescript
interface IssueStatusUpdate {
  status: 'pending' | 'in-progress' | 'resolved'
}
```

---

## Data Types

### Issue Model
```typescript
interface Issue {
  id: string                                            // Unique identifier
  title: string                                         // Issue title
  description?: string                                  // Detailed description
  category?: string                                     // Category (IT, Facilities, Hostel, etc.)
  location?: string                                     // Location on campus
  date?: string                                         // ISO date string (YYYY-MM-DDTHH:mm:ssZ)
  status?: 'pending' | 'in-progress' | 'resolved'      // Issue status
  submittedBy?: string                                  // User who submitted
  approved?: boolean                                    // Admin approval status
}
```

---

## Error Handling

### Expected Error Responses

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "message": "Title is required"
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Issue with ID ISSUE-A001 not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Server error",
  "message": "Database connection failed"
}
```

---

## Frontend Integration Points

### 1. API Client (`lib/api.ts`)
All API calls go through the client in `lib/api.ts`. Includes:
- Proper type definitions
- Error handling
- Logging

### 2. Admin Dashboard (`app/admin/dashboard/page.tsx`)
- Uses `fetchIssues()` to load all issues
- Uses `approveIssue()` to approve issues
- Uses `resolveIssue()` to mark issues as resolved
- Displays charts based on issue data

### 3. Staff Dashboard (`app/staff/dashboard/page.tsx`)
- Uses `fetchIssues()` to load assigned issues
- Uses `resolveIssue()` to resolve issues
- Displays issue management interface

### 4. Report Issue Page (`app/report-issue/page.tsx`)
- Uses `createIssue()` to submit new issues

---

## Implementation Checklist for Backend Team

- [ ] Implement GET /api/issues endpoint
  - [ ] Connect to database (Firestore/PostgreSQL/MongoDB)
  - [ ] Return array of Issue objects
  - [ ] Handle errors gracefully

- [ ] Implement POST /api/issues endpoint
  - [ ] Validate request body
  - [ ] Generate unique issue ID
  - [ ] Store created_at timestamp
  - [ ] Return created Issue object

- [ ] Implement POST /api/issues/{id}/approve endpoint
  - [ ] Find issue by ID
  - [ ] Update approved field
  - [ ] Return updated Issue object

- [ ] Implement POST /api/issues/{id}/resolve endpoint
  - [ ] Find issue by ID
  - [ ] Update status to 'resolved'
  - [ ] Return updated Issue object

- [ ] Implement PATCH /api/issues/{id} endpoint (optional)
  - [ ] Find issue by ID
  - [ ] Update status field
  - [ ] Return updated Issue object

- [ ] Add proper error handling for all endpoints
- [ ] Add request validation
- [ ] Add logging/monitoring
- [ ] Test with frontend before deployment

---

## Sample Test Data

Use this sample data for testing:
```json
{
  "id": "ISSUE-TEST-001",
  "title": "Test Issue",
  "description": "This is a test issue",
  "category": "IT",
  "location": "Test Location",
  "date": "2026-02-08T10:00:00Z",
  "status": "pending",
  "submittedBy": "test_user",
  "approved": false
}
```

---

## Notes

- All timestamps should be ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Status values are: `pending`, `in-progress`, `resolved`
- Issue IDs should be unique (recommend UUID or custom format like "ISSUE-{timestamp}")
- All endpoints return JSON
- CORS headers should allow requests from frontend origin

---

## Questions?

If you encounter any issues during integration, please refer to:
1. Frontend error logs in browser console
2. Network tab in browser DevTools
3. API Client error handling in `lib/api.ts`
