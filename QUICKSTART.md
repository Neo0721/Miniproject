# Quick Start Guide

## 1. Install Dependencies
```bash
cd /Users/kunalpate/Desktop/HYPLCL/Miniproject
npm install
```

## 2. Start Development Server
```bash
npm run dev
```
Server: `http://localhost:3001`

## 3. Test the Frontend
- **Login Page:** `http://localhost:3001/login`
- **Admin:** Role: admin, Name: admin
- **Staff:** Role: staff, Name: staff
- **Student:** Role: student, Name: student
- **Teacher:** Role: teacher, Name: teacher

## 4. Connect Backend
1. Copy `.env.example` → `.env.local`
2. Update `NEXT_PUBLIC_API_BASE_URL` to your backend URL
3. Implement 5 endpoints (see `BACKEND_INTEGRATION.md`)

## 5. Key Files
- **API Client:** `lib/api.ts` - All backend calls
- **Admin Dashboard:** `app/admin/dashboard/page.tsx`
- **Staff Dashboard:** `app/staff/dashboard/page.tsx`
- **Sample Data:** `data/issues.json` - For testing reference

## 6. Important Docs
- **Full README:** `README.md`
- **Backend Integration:** `BACKEND_INTEGRATION.md`
- **Environment Setup:** `.env.example`

## 7. Endpoints to Implement
```
GET    /api/issues                     - Get all issues
POST   /api/issues                     - Create issue
POST   /api/issues/{id}/approve        - Approve issue
POST   /api/issues/{id}/resolve        - Resolve issue
PATCH  /api/issues/{id}                - Update status (optional)
```

## 8. API Client Usage
```typescript
import { fetchIssues, approveIssue, resolveIssue } from '@/lib/api'

// Fetch all issues
const issues = await fetchIssues()

// Approve an issue
const updated = await approveIssue('ISSUE-A001')

// Resolve an issue
const resolved = await resolveIssue('ISSUE-A001')
```

## Common Issues

**Dev server won't start?**
```bash
rm -rf .next
npm install
npm run dev
```

**Port already in use?**
Dev server will automatically use port 3001.

**API endpoints return empty?**
Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.

## Support
See `README.md` for detailed documentation and troubleshooting.
