# Quick Reference - Backend API Endpoints

## 🚀 Server Start
```bash
cd Backend
npm install
npm run dev
```

Expected output:
```
[ENV LOAD DEBUG] { 
  PORT: '5000',
  FIREBASE_SERVICE_ACCOUNT_PATH: 'src/config/firebase-admin.json',
  MONGO_URI: '✓ SET'
}
✅ Firebase Admin initialized successfully
   Project ID: your-project
MongoDB connected: ...
Server running on port: 5000
```

---

## 📋 Auth API Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "rollNo": "CS001",
  "phone": "+91-9876543210",
  "department": "Computer Science"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "firebaseUid": "...",
    "createdAt": "2024-02-02T..."
  }
}
```

**Error (400):** User already exists
```json
{
  "success": false,
  "message": "A user with this firebaseUid already exists",
  "error": "DUPLICATE_ENTRY"
}
```

---

### 2. Login User
**POST** `/api/auth/login`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:** (empty)

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... }
}
```

**Error (404):** User not found
```json
{
  "success": false,
  "message": "User not found. Please register first.",
  "error": "USER_NOT_FOUND",
  "actionRequired": "REGISTER"
}
```

---

### 3. Verify Token
**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Success (200):**
```json
{
  "success": true,
  "message": "Token verified and user found",
  "user": { ... }
}
```

**Error (401):** Invalid token
```json
{
  "success": false,
  "message": "Invalid or malformed token",
  "error": "INVALID_TOKEN"
}
```

---

### 4. Logout User
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Success (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🔑 Key Implementation Details

### Environment Variables (.env)
```dotenv
PORT=5000
MONGO_URI=mongodb+srv://...
FIREBASE_SERVICE_ACCOUNT_PATH=src/config/firebase-admin.json
FRONTEND_URL=http://localhost:3000
```

### Firebase Service Account
- File: `Backend/src/config/firebase-admin.json`
- Download from: Firebase Console → Project Settings → Service Accounts
- Must contain: `project_id`, `private_key`, `client_email`

### Database Schema (User)
```
{
  firebaseUid: String (unique) → Link to Firebase Auth ⭐
  email: String (unique, lowercase)
  name: String (required)
  role: String (student | teacher)
  rollNo: String (for students)
  teacherId: String (for teachers)
  phone: String (optional, validated)
  department: String (optional)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Authentication Flow
```
1. Frontend: Create user in Firebase Auth
2. Frontend: Get Firebase ID token
3. Frontend: Send POST /api/auth/register + token
4. Backend: Verify token (authMiddleware)
5. Backend: Save user to MongoDB with firebaseUid
6. Frontend: Use token for future API calls

Headers for all protected routes:
Authorization: Bearer <firebase_id_token>
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `FIREBASE_SERVICE_ACCOUNT_PATH not set` | Check `.env` file, restart server |
| `Firebase credentials file not found` | Download from Firebase Console, save to `src/config/firebase-admin.json` |
| `Token verification failed` | Ensure header format: `Authorization: Bearer <token>` |
| `User not found after login` | Must call `/register` first before `/login` |
| `CORS error` | Check `FRONTEND_URL` in `.env` |

---

## 📊 File Structure
```
Backend/
├── .env                          ← Add FIREBASE_SERVICE_ACCOUNT_PATH
├── src/
│   ├── server.js                 ← ✅ FIXED: dotenv first
│   ├── app.js
│   ├── config/
│   │   ├── firebase-admin.js     ← ✅ FIXED: proper init
│   │   ├── firebase-admin.json   ← ⭐ Add this (from Firebase)
│   │   └── db.js
│   ├── middleware/
│   │   └── authMiddleware.js     ← ✅ FIXED: correct import
│   ├── routes/
│   │   └── auth.js               ← ✅ FIXED: all flows
│   └── models/
│       └── User.js               ← ✅ ENHANCED: better indexes
└── BACKEND_FIXES.md              ← Detailed documentation
```

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"name":"John","email":"john@test.com","role":"student","rollNo":"CS001"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Verify
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## ✅ Production Checklist
- [ ] `.env` file configured with all variables
- [ ] `firebase-admin.json` downloaded and in `src/config/`
- [ ] `npm install` completed
- [ ] MongoDB URI working
- [ ] Firebase project linked
- [ ] Frontend `FRONTEND_URL` points to backend
- [ ] CORS enabled for frontend domain
- [ ] No sensitive data in code/git
- [ ] Server starts without errors: `npm run dev`
- [ ] All endpoints tested with valid token

---

**Everything is ready! Start the server and test the endpoints.** 🎉
