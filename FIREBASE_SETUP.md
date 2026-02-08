# Firebase Setup Guide

This guide will walk you through setting up Firebase for the Dhivehi Type scoreboard feature with user authentication.

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
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

> **Note:** We use email/password authentication, but usernames are the primary identifier. The system automatically creates email addresses from usernames (username@dhivehitype.local).

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

    // Users collection - for user stats tracking
    match /users/{userId} {
      // Anyone can read user stats
      allow read: if true;

      // Only the user themselves can create/update their stats
      allow create, update: if request.auth != null
                            && request.auth.uid == userId;

      // Users cannot be deleted
      allow delete: if false;
    }

    // Usernames collection - for username uniqueness checking
    match /usernames/{username} {
      // Anyone can read to check username availability
      allow read: if true;

      // Only authenticated users can create username mappings
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.username is string
                    && request.resource.data.username.size() >= 2
                    && request.resource.data.username.size() <= 20;

      // Usernames cannot be modified or deleted
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
3. Play a game and complete it
4. After game over, you'll see the auth modal
5. **Create an account** with a username and password
6. Check browser console for:
   - `✅ Firebase initialized successfully`
   - `✅ Registered as <username>`
   - `💾 Score saved to Firebase`

7. Press `L` to view the leaderboard
8. Your score should appear!

## Step 9: Test Cross-Device Login

1. Open the game on another browser or device
2. Play a game and reach game over
3. Click the **"Login"** tab in the auth modal
4. Enter your username and password
5. Your stats should sync from the other device!

## How It Works

### Username Uniqueness
- Usernames are stored in a `usernames` collection
- Each username document maps to a user ID
- Registration checks if the username exists before creating the account

### Cross-Device Login
- Users create an account with username + password
- Behind the scenes, we use email/password auth with format: `username@dhivehitype.local`
- Login from any device with your username and password
- Stats and scores sync automatically via Firebase

### Offline Mode
- If Firebase is disabled or unavailable, the game uses localStorage
- All features work offline, but data won't sync across devices

## Troubleshooting

### "Username already taken" error

- This means someone else registered that username
- Try a different username
- Usernames are case-insensitive

### "Invalid username or password" error

- Check that you're entering the correct credentials
- If you forgot your password, you'll need to create a new account
- (Password reset can be added in the future)

### "Firebase config incomplete" message

- Make sure you updated `.env` (not `.env.example`)
- Ensure all values are copied correctly from Firebase Console
- Restart the dev server after changing `.env`

### "Permission denied" error when saving scores

- Check that Email/Password authentication is enabled
- Verify Firestore security rules are set correctly
- Make sure you're logged in (entered username and password)

### Scores not appearing in leaderboard

- Open Firebase Console > Firestore Database
- Check if there's a `scores` collection with documents
- If empty, scores aren't being saved - check browser console for errors

## Optional: Disable Firebase (Offline Mode)

If you want to run the game without Firebase:

1. Set in `.env`:
   ```env
   VITE_DISABLE_FIREBASE=true
   ```

2. The game will work with:
   - Local scores only (saved to browser localStorage)
   - No global leaderboard
   - No cross-device sync
   - Local authentication only

## Cost & Limits

Firebase free tier ("Spark plan") includes:

- ✅ **Authentication**:
  - Unlimited email/password users
  - No cost for authentication
- ✅ **Firestore**:
  - 50,000 reads/day
  - 20,000 writes/day
  - 1 GB storage
- ✅ **Bandwidth**: 10 GB/month

For a typing game with ~100 daily users, you'll stay well within free limits.

## Step 10: Create Firestore Index (Automatic)

When you first open the leaderboard, Firebase will automatically create a required index:

1. **First time opening leaderboard**, you might see an error in the console
2. The error will contain a **link** to create the index
3. **Click the link** - it will open Firebase Console
4. Click **"Create Index"** button
5. Wait 1-2 minutes for the index to build
6. Refresh the game and the leaderboard will work!

**Alternative:** The index usually creates automatically, so you might not need to do anything.

## Next Steps

- View your data in Firestore Console
- Monitor usage in Firebase Console > Usage
- The leaderboard now shows each user's **best score** only
- All game history is still saved in the `scores` collection
- Consider upgrading to Blaze (pay-as-you-go) only if you exceed limits

---

Need help? Check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- Project issues on GitHub
