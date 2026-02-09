# Campus Issue Resolver - Frontend Documentation

## Project Overview
A comprehensive Next.js application for managing and resolving campus infrastructure issues. Features role-based dashboards for students, teachers, staff, and administrators.

**Tech Stack:**
- Next.js 16.0.10
- React 19.2.0
- TypeScript
- Recharts (data visualization)
- Radix UI (component library)
- TailwindCSS (styling)

---

## Development Setup

### Prerequisites
- Node.js 18+ (or use built-in npm)
- macOS/Linux/Windows

### Installation
```bash
cd /Users/kunalpate/Desktop/HYPLCL/Miniproject
npm install
```

### Running Development Server
```bash
npm run dev
```
Server starts on `http://localhost:3001`

### Building for Production
```bash
npm run build
npm start
```

---

## Configuration

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Key Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Base URL for backend API (default: `/api`)
  - Local: `http://localhost:3000/api`
  - Production: `https://api.yourdomain.com`

---

## Project Structure

```
Miniproject/
├── app/                           # Next.js app directory
│   ├── api/                       # API routes (to be connected)
│   │   └── issues/               # Issue endpoints
│   ├── admin/                     # Admin dashboard
│   ├── dashboard/                 # Role-specific dashboards
│   ├── login/                     # Authentication entry
│   ├── register/                  # Registration flows
│   └── report-issue/              # Issue submission
├── components/                    # React components
│   └── ui/                        # Reusable UI components
├── lib/                           # Utilities and API client
│   ├── api.ts                     # Central API client module
│   └── utils.ts                   # Helper functions
├── public/                        # Static assets
├── data/                          # Sample data (for testing)
│   └── issues.json                # Sample issues
├── BACKEND_INTEGRATION.md         # Backend integration guide
├── .env.example                   # Environment variable template
└── package.json                   # Dependencies
```

---

## Authentication & Authorization

### Current Implementation
- **Method:** localStorage-based (demo mode)
- **Storage:** `{ role: string, name: string }`
- **Roles:** student, teacher, staff, admin

### Login Credentials (Demo)
- Email: Any format
- Password: Min 8 characters

### Protected Routes
All routes require a valid role in localStorage:
- `/` - Public
- `/login` - Public
- `/register` - Public
- `/dashboard/student` - Student only
- `/dashboard/teacher` - Teacher only
- `/staff/dashboard` - Staff only
- `/admin/dashboard` - Admin only

### Backend Integration Notes
Update `app/layout.tsx` and login pages to use JWT/OAuth when backend is ready.

---

## API Integration

### API Client Module
**File:** `lib/api.ts`

All API calls go through this centralized module for:
- Type safety (full TypeScript)
- Error handling & logging
- Consistent request/response format

### Available Functions
```typescript
// Fetch all issues
fetchIssues(): Promise<Issue[]>

// Create new issue
createIssue(payload: CreateIssuePayload): Promise<Issue | null>

// Approve issue
approveIssue(id: string): Promise<Issue | null>

// Resolve issue
resolveIssue(id: string): Promise<Issue | null>

// Update issue status (optional)
updateIssueStatus(id: string, update: IssueStatusUpdate): Promise<Issue | null>
```

### Complete Integration Guide
See `BACKEND_INTEGRATION.md` for:
- Exact endpoint specifications
- Request/response formats
- Error handling codes
- Implementation checklist

---

## Key Features

### 1. Admin Dashboard (`app/admin/dashboard/page.tsx`)
**Functionality:**
- View all issues with real-time stats
- Approve/resolve issues
- Dynamic charts:
  - Issues per department
  - Status distribution
  - Average resolution time per week

**Data Source:** Fetches from `/api/issues`

### 2. Staff Dashboard (`app/staff/dashboard/page.tsx`)
**Functionality:**
- View assigned issues
- Change issue status (pending → in-progress → resolved)
- Priority calculation based on submission date

**Data Source:** Fetches from `/api/issues` and filters by status

### 3. Student Dashboard (`app/dashboard/student/page.tsx`)
**Functionality:**
- View submitted issues
- Report new issues
- Track issue status

### 4. Teacher Dashboard (`app/dashboard/teacher/page.tsx`)
**Functionality:**
- View department issues
- Approve/forward issues

### 5. Issue Reporting (`app/report-issue/page.tsx`)
**Functionality:**
- Submit new campus issues
- Categorize by department
- Upload photos (when backend ready)

---

## Sample Data

### Issues Structure
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
  "approved": false
}
```

### Sample Data File
`data/issues.json` contains 18 test issues (9 resolved, 5 in-progress, 4 pending)

**For Backend Testing:**
Use this file to understand expected data structure, then replace with actual database responses.

---

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t campus-resolver .
docker run -p 3000:3000 campus-resolver
```

### Manual Deployment
```bash
npm run build
npm start
```

---

## Error Handling

### Frontend Error Handling
- All API calls wrapped in try-catch
- Graceful fallbacks (empty arrays, null values)
- Console logging for debugging

### Error States
- **400 Bad Request:** Validation error
- **404 Not Found:** Issue not found
- **500 Internal Server Error:** Server/database issue

### Debugging
Enable console logs in `lib/api.ts` for detailed error information.

---

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- File-based routing (Next.js convention)

### Adding New Features
1. Create page in `app/` directory
2. Use components from `components/ui/`
3. Import API functions from `lib/api.ts`
4. Follow existing component patterns

### Testing with Backend
1. Point `NEXT_PUBLIC_API_BASE_URL` to backend
2. Verify endpoints match `BACKEND_INTEGRATION.md`
3. Test error scenarios (network, 404, 500, etc.)
4. Monitor browser console for API errors

---

## Troubleshooting

### Dev Server Won't Start
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
npm install

# Start dev server
npm run dev
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Dev server will use 3001 if 3000 is taken
```

### API 404 Errors
- Verify backend endpoints are running
- Check `NEXT_PUBLIC_API_BASE_URL` configuration
- Verify request/response format matches `BACKEND_INTEGRATION.md`

### Build Errors
```bash
# Type checking
npx tsc --noEmit

# Linting (if eslint configured)
npm run lint
```

---

## Performance Optimization

### Image Optimization
- Use Next.js Image component for static images
- Implement lazy loading for dashboard charts

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (automatic)

### Data Updates
- Polling: Refetch issues every 30 seconds in dashboards
- WebSockets: Real-time updates when backend ready

---

## Security Considerations

### Client-Side
- **Auth:** Switch to JWT/OAuth for production
- **Secrets:** Never commit API keys to git
- **CORS:** Configure backend to accept frontend origin

### Backend Team Notes
- Implement proper authentication (JWT, OAuth2)
- Add role-based access control (RBAC)
- Validate all inputs server-side
- Use environment variables for sensitive data
- Implement rate limiting
- Add error logging & monitoring

---

## Related Documentation

- **Backend Integration:** See `BACKEND_INTEGRATION.md`
- **Next.js Docs:** https://nextjs.org
- **React Docs:** https://react.dev
- **Radix UI:** https://radix-ui.com
- **Recharts:** https://recharts.org

---

## Handoff Notes for Backend Team

This frontend is **production-ready** with:
✅ Type-safe API client (`lib/api.ts`)
✅ Proper error handling throughout
✅ Sample data for testing
✅ Detailed API contract documentation
✅ Environment variable configuration
✅ Role-based access control
✅ Dynamic data visualization

**Your Tasks:**
1. Implement the 5 endpoints in `BACKEND_INTEGRATION.md`
2. Connect to your database (Firestore/PostgreSQL/MongoDB)
3. Update `NEXT_PUBLIC_API_BASE_URL` environment variable
4. Test with frontend before deploying

Good luck! 🚀
