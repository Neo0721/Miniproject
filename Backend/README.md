# Campus Issue Resolver - Backend

A production-grade backend for the Campus Issue Resolver application. Built with Node.js, Express, MongoDB, and Firebase Authentication.

## 🚀 Features

- **Firebase Authentication**: Secure user authentication with email/password
- **MongoDB Atlas Integration**: Scalable database for users and issues
- **Role-Based Access**: Support for students and teachers
- **RESTful API**: Clean and well-documented API endpoints
- **Input Validation**: Comprehensive validation for all inputs
- **Error Handling**: Proper error responses and logging
- **Security**: Firebase token verification, CORS protection

## 📋 Prerequisites

Before you start, ensure you have:

- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB Atlas account and cluster
- Firebase project with Authentication enabled

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
cd Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `Backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-issue-resolver?retryWrites=true&w=majority

# Firebase (choose one method)
# Method 1: Service Account File
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Method 2: Environment Variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 4. Set Up Firebase Credentials

#### Option A: Service Account File (Recommended for Production)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save as `firebase-service-account.json` in the Backend folder
5. Add to `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

#### Option B: Environment Variables (Development)

1. In `firebase-service-account.json`, get:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

2. In `.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   ```

### 5. Configure MongoDB Atlas

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with password
3. Get the connection string (contains your username and password)
4. Update `MONGO_URI` in `.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-issue-resolver?retryWrites=true&w=majority
   ```

5. Whitelist your IP address in MongoDB Atlas:
   - Go to Network Access
   - Click "Add IP Address"
   - Add your current IP or 0.0.0.0/0 for development

### 6. Start the Backend

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user or retrieve existing user

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@college.edu",
  "role": "student",
  "phone": "+1234567890",
  "rollNo": "2024CS001",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@college.edu",
    "role": "student",
    "rollNo": "2024CS001",
    "department": "Computer Science",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/auth/verify
Verify Firebase token and get user info

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token verified",
  "user": { /* user object */ }
}
```

### Users

#### GET /api/users/me
Get current user's profile

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

#### PUT /api/users/me
Update current user's profile

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "department": "Computer Science"
}
```

### Issues

#### POST /api/issues
Create a new issue

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Broken classroom projector",
  "category": "Classroom Equipment",
  "location": "Block A, Room 101",
  "description": "The projector in Block A Room 101 is not working",
  "priority": "high"
}
```

#### GET /api/issues/my
Get user's issues with filtering

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Query Parameters:**
- `status` - Filter by status: `pending`, `in_progress`, `resolved`
- `category` - Filter by category
- `limit` - Results per page (default: 10)
- `page` - Page number (default: 1)

Example:
```
GET /api/issues/my?status=pending&limit=20&page=1
```

#### GET /api/issues/:id
Get a specific issue by ID

#### PUT /api/issues/:id
Update an issue

**Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "resolution": "Issue is being investigated"
}
```

#### DELETE /api/issues/:id
Delete an issue (creator only)

#### GET /api/issues
Get all issues (with filters) - for staff/admin

**Query Parameters:**
- `status` - Filter by status
- `category` - Filter by category
- `limit` - Results per page (default: 20)
- `page` - Page number (default: 1)

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String,
  role: String enum ["student", "teacher"] (required),
  rollNo: String (for students),
  teacherId: String (for teachers),
  department: String,
  firebaseUid: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

### Issue Model
```javascript
{
  title: String (required),
  category: String enum [...] (required),
  location: String (required),
  description: String (required),
  status: String enum ["pending", "in_progress", "resolved"] (default: "pending"),
  reportedBy: ObjectId ref "User" (required),
  assignedTo: ObjectId ref "User",
  resolution: String,
  priority: String enum ["low", "medium", "high"] (default: "medium"),
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date
}
```

## 🔐 Security Features

- **Firebase Token Verification**: All protected routes verify Firebase ID tokens
- **Input Validation**: Mongoose schema validation on all models
- **CORS Protection**: Configurable CORS origin
- **Error Handling**: Comprehensive error responses without exposing sensitive info
- **Password Handling**: Firebase handles password storage securely
- **Database Indexing**: Optimized indexes for common queries

## 📝 Error Handling

All API responses include:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "ERROR_CODE"
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid token
- `USER_NOT_FOUND` - User doesn't exist
- `VALIDATION_ERROR` - Input validation failed
- `DUPLICATE_ENTRY` - Email already registered
- `ISSUE_NOT_FOUND` - Issue doesn't exist
- `TOKEN_EXPIRED` - Firebase token expired
- `INVALID_TOKEN` - Token is malformed

## 🧪 Testing Flows

### Flow 1: Register Student
```bash
# 1. Sign up in frontend with email/password
# 2. Backend receives Firebase token
# 3. Create user in MongoDB
# 4. Auto-login and redirect to dashboard
```

### Flow 2: Report Issue
```bash
# 1. User logs in
# 2. Navigate to "Report Issue"
# 3. Submit issue form
# 4. Backend creates issue with reportedBy = user._id
# 5. Show success with issue ID
```

### Flow 3: View My Issues
```bash
# 1. User navigates to "My Issues"
# 2. Backend queries issues where reportedBy = user._id
# 3. Display with filtering and pagination
```

## 🚀 Deployment

### Heroku Deployment

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGO_URI=your_mongo_uri
heroku config:set FIREBASE_PROJECT_ID=your_project_id
# ... set other variables

# Deploy
git push heroku main
```

### Environment Variables on Heroku

Set all variables from `.env.example` using:
```bash
heroku config:set KEY=value
```

## 📊 Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   └── firebase.js     # Firebase initialization
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification
│   ├── models/
│   │   ├── User.js         # User schema
│   │   └── Issue.js        # Issue schema
│   ├── routes/
│   │   ├── auth.js         # Auth endpoints
│   │   ├── users.js        # User endpoints
│   │   └── issues.js       # Issue endpoints
│   ├── app.js              # Express app
│   └── server.js           # Server entry point
├── .env.example            # Environment variables template
├── package.json            # Dependencies
└── README.md              # This file
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Ensure username/password are URL-encoded

### Firebase Authentication Issues
- Verify service account JSON is valid
- Check Firebase project ID matches
- Ensure user exists in Firebase Console

### CORS Errors
- Update `CORS_ORIGIN` in `.env`
- Ensure frontend URL is correct
- Check browser console for specific errors

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001
```

## 📞 Support

For issues or questions:
1. Check the error logs in console
2. Verify all environment variables are set
3. Ensure all services (MongoDB, Firebase) are accessible
4. Check frontend API URL configuration

## 📄 License

This project is part of Campus Issue Resolver for college evaluation purposes.

## 🎓 Academic Notes

This backend is designed for college-level evaluation with:
- Production-grade code quality
- Comprehensive error handling
- Security best practices
- Clean separation of concerns
- Scalable architecture
- Professional documentation

Perfect for showcasing in viva and practical exams!