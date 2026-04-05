# HCAP App Deployment Guide 🚀

This guide covers deploying your **Backend** strictly to the internet via Railway and configuring your **Mobile App** (APK) to connect to it.

---

## 1. Deploying the Backend (Railway)

We recommend using [Railway](https://railway.app/) for a fast, free-tier backend deployment.

### Step 1: Connect your account
1. Create a [Railway.app](https://railway.app/) account.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your `Miniproject` repository. 

### Step 2: Configure Environment Variables
1. Once the project starts building on Railway, click on the project box to open its dashboard.
2. Navigate to the **Variables** tab.
3. Click "New Variable" or paste all your backend environment variables from your local `Backend/.env` file. You absolutely need:
   - `MONGO_URI` (Your MongoDB URL)
   - `PORT` (Usually `5000`)
   - `EMAIL_HOST` (e.g. `smtp.gmail.com` or `smtp-mail.outlook.com`)
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - Any Firebase secret paths/values your backend relies on.

### Step 3: Get your Backend URL
1. Go to the project **Settings** tab.
2. Scroll down to **Networking** and click **Generate Domain**.
3. Railway will give you a domain link *(Example: `hcap-backend-production.up.railway.app`)*.
4. **Copy this URL!** This is what your mobile app will use to communicate.

---

## 2. Generating the Mobile App (Android APK)

Now that your backend is up and running in the cloud, you need to tell your mobile app to point to it instead of `localhost`.

### Step 1: Update Environment Targets
Inside your code editor, open `Frontend/.env.local`.
Update the backend URL to point to your new LIVE Railway server URL you just generated:

```env
# Before (Local):
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# After (Live):
NEXT_PUBLIC_BACKEND_URL=https://hcap-backend-production.up.railway.app
NEXT_PUBLIC_API_BASE_URL=https://hcap-backend-production.up.railway.app/api
```

### Step 2: Build the Frontend Static Code
You need to package your raw TypeScript Next.js code into static files for the mobile app to read.
Run these terminal commands inside your `Frontend/` folder:
```bash
npm run build
npx cap sync android
```
*(This tells Capacitor to grab all the code and inject it directly into the native Android platform.)*

### Step 3: Compile the Android APK
1. Open **Android Studio**.
2. In the menu, go to **File > Open**, and select the `Frontend/android` folder.
3. Wait for gradle to finish syncing (watch the progress bar at bottom right).
4. Go to the top toolbar: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. *(Optional for Google Play): If you are uploading to the Google Play Store, click **Generate Signed Bundle / APK**.*
6. Once the build is successfully completed, a prompt will appear on the bottom right corner of Android Studio. Click **locate** to open the folder containing your `.apk` file!

**You are done!** You can now send this `.apk` file straight to users via WhatsApp, Google Drive, or Email to install!
