# Frontend Setup Guide

This guide walks you through setting up the Campus Issue Resolver frontend with Firebase Authentication and backend API integration.

## ✅ Prerequisites

- Node.js v16 or higher
- npm or pnpm package manager
- Firebase project with Authentication enabled
- Backend server running (see Backend README)

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
cd Frontend
pnpm install
# or
npm install
```

### 2. Firebase Configuration

#### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings
3. Scroll to "Your apps" section
4. Select or create a Web app
5. Copy the Firebase config:

```javascript
{
  "apiKey": "AIzaSy...",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123..."
}
```

#### Step 2: Set Environment Variables

Create a `.env.local` file in the Frontend directory:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123...

# Optional: Use Firebase Emulator for local development
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

### 3. Start the Development Server

```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Build for Production

```bash
pnpm build
pnpm start
```

## 🔐 Firebase Setup Checklist

- [ ] Firebase project created
- [ ] Web app registered in Firebase
- [ ] Authentication → Sign-in method → Email/Password enabled
- [ ] Firebase config copied to `.env.local`
- [ ] Backend has Firebase credentials configured
- [ ] Backend `FRONTEND_URL` matches your frontend URL

## 📱 User Flows

### 1. Student Registration

```
1. User clicks "Register" → "Student"
2. Fills in: Name, Email, Phone, Roll No, Department
3. Creates password
4. Clicks "Create Account"
5. Firebase creates auth user
6. Backend stores user data in MongoDB
7. Auto-login and redirect to dashboard
```

### 2. Student Login

```
1. User enters email and password
2. Firebase authenticates
3. Backend verifies token
4. Fetches user profile from MongoDB
5. Redirects to appropriate dashboard
```

### 3. Report Issue

```
1. Student clicks "Report Issue"
2. Fills in: Title, Category, Location, Description
3. Clicks "Submit Issue"
4. Backend creates issue linked to user
5. Shows success with issue ID
```

### 4. View My Issues

```
1. Clicks "My Issues"
2. Frontend fetches issues from backend
3. Displays with status, progress, filtering
4. Can click to view details
```

## 🛠️ Development

### Project Structure

```
Frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── login/page.tsx       # Login page
│   ├── register/            # Registration pages
│   ├── dashboard/           # Dashboard pages
│   ├── profile/page.tsx     # Profile page
│   ├── report-issue/page.tsx    # Report issue page
│   └── my-issues/page.tsx       # My issues page
├── components/              # React components
│   ├── ui/                  # UI components
│   └── ...
├── lib/
│   ├── api.ts              # API client functions
│   ├── firebase.ts         # Firebase configuration
│   └── utils.ts            # Utility functions
├── .env.example             # Environment template
├── next.config.mjs          # Next.js config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

### Key API Integration Files

- **[lib/api.ts](lib/api.ts)** - All API calls with Firebase token
- **[lib/firebase.ts](lib/firebase.ts)** - Firebase initialization
- **app/register/student/page.tsx** - Student registration with backend
- **app/login/page.tsx** - Login with Firebase + backend
- **app/profile/page.tsx** - Profile fetch from backend
- **app/report-issue/page.tsx** - Create issue on backend
- **app/my-issues/page.tsx** - Fetch user's issues from backend

## 🔗 API Integration Examples

### Making API Calls

```typescript
import { getMyIssues, createIssue, getProfile } from '@/lib/api'

// Get user profile
const result = await getProfile()
if (result.success) {
  console.log(result.data.user)
} else {
  console.error(result.message)
}

// Get user's issues
const issues = await getMyIssues({ status: 'pending' })

// Create issue
const newIssue = await createIssue({
  title: "Broken projector",
  category: "Classroom Equipment",
  location: "Block A, Room 101",
  description: "The projector is not turning on"
})
```

### Automatic Token Attachment

All API calls automatically:
1. Get Firebase ID token from current user
2. Attach it to `Authorization: Bearer <token>` header
3. Handle token expiration
4. Redirect to login if unauthorized

No manual token handling needed!

## 🧪 Testing

### Test User Credentials

Use any email/password to register (min 8 characters):
- Email: `student@college.edu`
- Password: `Password123`

### Test Flows

1. **Register as Student**
   - Fill all fields
   - Should redirect to dashboard

2. **Report Issue**
   - Fill issue form
   - Should create issue and show ID

3. **View My Issues**
   - Should load issues from backend
   - Filter and search should work

4. **Edit Profile**
   - Change name, phone, department
   - Should save to backend

## 🐛 Troubleshooting

### "Firebase configuration is incomplete" Warning

**Solution**: Check all `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`

### API Calls Failing

**Solution**:
1. Verify backend is running: `http://localhost:5000`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors
4. Verify Firebase token is valid

### Login Not Working

**Solution**:
1. Verify Firebase credentials in `.env.local`
2. Check Firebase has Email/Password auth enabled
3. Check user exists in Firebase Console
4. Check backend `/api/auth/verify` endpoint

### Profile Page Blank

**Solution**:
1. Ensure you're logged in
2. Check backend returns user data
3. Verify Firebase token is valid
4. Check browser console for errors

### Issues Not Loading

**Solution**:
1. Create at least one issue first
2. Check backend returns issues list
3. Verify user ID matches in database
4. Check filters aren't hiding issues

## 📝 Code Examples

### Fetching Data in Components

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getProfile } from '@/lib/api'

export default function MyComponent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const result = await getProfile()
      if (result.success) {
        setUser(result.data)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{user?.name}</div>
}
```

### Creating Data

```tsx
const handleSubmit = async (e) => {
  e.preventDefault()
  const result = await createIssue({
    title: formData.title,
    category: formData.category,
    location: formData.location,
    description: formData.description
  })

  if (result.success) {
    alert('Issue created!')
  } else {
    alert(result.message)
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
```

### Environment Variables for Production

Update in your deployment platform:
- `NEXT_PUBLIC_API_URL` → Your backend URL (e.g., `https://backend.example.com`)
- All `NEXT_PUBLIC_FIREBASE_*` variables from Firebase Console

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module 'firebase'" | Run `pnpm install` or `npm install` |
| API calls return 401 | Check Firebase credentials and login status |
| Page shows "Loading..." forever | Check backend URL and API response |
| Firebase config warning | Ensure all `NEXT_PUBLIC_FIREBASE_*` env vars are set |
| CORS error in console | Update `NEXT_PUBLIC_API_URL` to backend URL |

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Hooks](https://react.dev/reference/react/hooks)

## 📋 Checklist for Production Deployment

- [ ] All environment variables set
- [ ] Firebase auth working
- [ ] Backend API responding
- [ ] All pages load correctly
- [ ] Registration flow works end-to-end
- [ ] Issue reporting works
- [ ] Issue listing works
- [ ] Profile updates work
- [ ] Logout works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No TypeScript errors

---

**Need Help?** Check the Backend README for backend-specific setup!