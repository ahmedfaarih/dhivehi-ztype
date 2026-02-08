# Firebase Setup Guide

This guide will walk you through setting up Firebase for the Dhivehi Type scoreboard feature.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "dhivehi-type")
4. Disable Google Analytics (not needed for this project)
5. Click **"Create project"**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "Dhivehi Type Web")
3. **Do NOT** check "Firebase Hosting" (unless you plan to deploy there)
4. Click **"Register app"**
5. You'll see your Firebase configuration - **keep this page open**

## Step 3: Copy Firebase Configuration

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 4: Update Your .env File

1. Open `.env` in your project root (NOT `.env.example`)
2. Replace the placeholder values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Leave this as false to enable Firebase
VITE_DISABLE_FIREBASE=false
```

## Step 5: Enable Authentication

1. In Firebase Console, go to **Build** > **Authentication**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click on **"Anonymous"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

> **Why Anonymous?** We use anonymous auth to create unique user IDs without requiring email/password. The username is stored separately.

## Step 6: Create Firestore Database

1. In Firebase Console, go to **Build** > **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select a location closest to your users (e.g., `asia-southeast1` for Maldives)
5. Click **"Enable"**

## Step 7: Set Up Firestore Security Rules

1. In Firestore, go to the **"Rules"** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Scores collection - anyone can read, authenticated users can write
    match /scores/{scoreId} {
      // Anyone can read scores for leaderboard
      allow read: if true;

      // Only authenticated users can create scores
      allow create: if request.auth != null
                    && request.resource.data.keys().hasAll(['username', 'userId', 'score', 'wave', 'wpm', 'accuracy', 'timestamp', 'date'])
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.score is int
                    && request.resource.data.score >= 0
                    && request.resource.data.username is string
                    && request.resource.data.username.size() >= 2
                    && request.resource.data.username.size() <= 20;

      // Scores cannot be modified or deleted
      allow update, delete: if false;
    }
  }
}
```

3. Click **"Publish"**

## Step 8: Test the Integration

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open the game in your browser
3. You should see a login modal asking for a username
4. Enter a username and start playing
5. After game over, check the browser console for:
   - `✅ Firebase initialized successfully`
   - `💾 Score saved!`

6. Press `L` to view the leaderboard
7. Your score should appear!

## Troubleshooting

### "Firebase config incomplete" message

- Make sure you updated `.env` (not `.env.example`)
- Ensure all values are copied correctly from Firebase Console
- Restart the dev server after changing `.env`

### "Permission denied" error when saving scores

- Check that Anonymous authentication is enabled
- Verify Firestore security rules are set correctly
- Make sure you're logged in (entered a username)

### Scores not appearing in leaderboard

- Open Firebase Console > Firestore Database
- Check if there's a `scores` collection with documents
- If empty, scores aren't being saved - check browser console for errors

### Game works but no Firebase features

- Check browser console for Firebase initialization errors
- Verify `.env` values are correct
- Make sure `VITE_DISABLE_FIREBASE` is set to `false`

## Optional: Disable Firebase (Offline Mode)

If you want to run the game without Firebase:

1. Set in `.env`:
   ```env
   VITE_DISABLE_FIREBASE=true
   ```

2. The game will work with:
   - Local scores only (saved to browser localStorage)
   - No global leaderboard
   - No authentication required

## Cost & Limits

Firebase free tier ("Spark plan") includes:

- ✅ **Authentication**: Unlimited anonymous users
- ✅ **Firestore**:
  - 50,000 reads/day
  - 20,000 writes/day
  - 1 GB storage
- ✅ **Bandwidth**: 10 GB/month

For a typing game with ~100 daily users, you'll stay well within free limits.

## Next Steps

- View your data in Firestore Console
- Monitor usage in Firebase Console > Usage
- Add indexes if queries become slow (Firebase will prompt you)
- Consider upgrading to Blaze (pay-as-you-go) only if you exceed limits

---

Need help? Check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- Project issues on GitHub
