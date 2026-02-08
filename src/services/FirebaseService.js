import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * Firebase Service for authentication and scoreboard
 * Falls back to localStorage if Firebase is not configured or fails
 */
export class FirebaseService {
  constructor() {
    this.enabled = false;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;

    // Initialize Firebase
    this.initialize();
  }

  /**
   * Initialize Firebase with environment variables
   */
  async initialize() {
    try {
      // Check if Firebase is disabled via env var
      if (import.meta.env.VITE_DISABLE_FIREBASE === 'true') {
        console.log('🔥 Firebase is disabled via environment variable');
        return;
      }

      // Get Firebase config from environment variables
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

      // Check if all required config values are present
      const hasAllKeys = Object.values(firebaseConfig).every(
        val => val && val !== 'your_api_key_here' && !val.includes('your_')
      );

      if (!hasAllKeys) {
        console.warn('⚠️ Firebase config incomplete. Running in offline mode.');
        console.log('💡 Update .env file with your Firebase credentials to enable scoreboard.');
        return;
      }

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);

      this.enabled = true;
      console.log('✅ Firebase initialized successfully');

      // Try to restore previous session
      await this.restoreSession();

    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      console.log('🎮 Game will continue without online scoreboard');
      this.enabled = false;
    }
  }

  /**
   * Restore previous user session from localStorage
   */
  async restoreSession() {
    if (!this.enabled) return;

    const savedUsername = this.getLocalUsername();
    if (savedUsername && this.auth.currentUser) {
      this.currentUser = {
        uid: this.auth.currentUser.uid,
        username: savedUsername
      };
      console.log(`👤 Welcome back, ${savedUsername}!`);
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username) {
    if (!this.enabled || !this.db) {
      return true; 
    }

    try {
      const usernameDoc = await getDoc(doc(this.db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Failed to check username availability:', error);
      return true; 
    }
  }

  /**
   * Register new user with username and password
   */
  async registerUsername(username, password) {
    console.log('🔐 Attempting to register username:', username);

    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const trimmedUsername = username.trim();

    // Validate username
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      throw new Error('Username must be between 2 and 20 characters');
    }

    try {
      if (this.enabled) {
        console.log('🔥 Firebase is enabled, registering with Firebase...');

        // Check if username is available
        const available = await this.isUsernameAvailable(trimmedUsername);
        if (!available) {
          throw new Error('Username already taken. Please choose another.');
        }

        // Create email from username (username@dhivehitype.local)
        const email = `${trimmedUsername.toLowerCase().replace(/\s/g, '_')}@dhivehitype.local`;
        console.log('📧 Generated email:', email);

        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        console.log('✅ Firebase user created');

        await updateProfile(userCredential.user, {
          displayName: trimmedUsername
        });

        // Store username mapping in Firestore
        await setDoc(doc(this.db, 'usernames', trimmedUsername.toLowerCase()), {
          uid: userCredential.user.uid,
          username: trimmedUsername,
          createdAt: Date.now()
        });
        console.log('✅ Username mapping saved');

        this.currentUser = {
          uid: userCredential.user.uid,
          username: trimmedUsername
        };

        console.log(`✅ Registered as ${trimmedUsername}`);
      } else {
        console.log('⚠️ Firebase not enabled, using offline mode');
        // Offline mode - just store locally
        this.currentUser = {
          uid: 'local_' + Date.now(),
          username: trimmedUsername
        };
        console.log(`✅ Playing as ${trimmedUsername} (offline mode)`);
      }

      // Save username and password to localStorage
      this.saveLocalUsername(trimmedUsername);
      this.saveLocalPassword(password);

      return this.currentUser;

    } catch (error) {
      console.error('❌ Registration failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);

      // Check for specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Username already taken. Please choose another.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled. Please enable it in Firebase Console.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }

      // Fallback to offline mode
      console.log('⚠️ Falling back to offline mode');
      this.currentUser = {
        uid: 'local_' + Date.now(),
        username: trimmedUsername
      };
      this.saveLocalUsername(trimmedUsername);
      this.saveLocalPassword(password);

      return this.currentUser;
    }
  }

  /**
   * Login with existing username and password
   */
  async loginUsername(username, password) {
    console.log('🔐 Attempting to login username:', username);

    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    const trimmedUsername = username.trim();

    try {
      if (this.enabled) {
        console.log('🔥 Firebase is enabled, logging in with Firebase...');

        // Create email from username
        const email = `${trimmedUsername.toLowerCase().replace(/\s/g, '_')}@dhivehitype.local`;
        console.log('📧 Generated email:', email);

        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('✅ Firebase login successful');

        this.currentUser = {
          uid: userCredential.user.uid,
          username: userCredential.user.displayName || trimmedUsername
        };

        console.log(`✅ Logged in as ${trimmedUsername}`);
      } else {
        console.log('⚠️ Firebase not enabled, checking local credentials');
        // Offline mode - check local credentials
        const savedPassword = this.getLocalPassword();
        const savedUsername = this.getLocalUsername();

        if (savedUsername?.toLowerCase() === trimmedUsername.toLowerCase() && savedPassword === password) {
          this.currentUser = {
            uid: 'local_' + Date.now(),
            username: savedUsername
          };
          console.log(`✅ Logged in as ${trimmedUsername} (offline mode)`);
        } else {
          throw new Error('Invalid username or password');
        }
      }

      // Save credentials to localStorage
      this.saveLocalUsername(trimmedUsername);
      this.saveLocalPassword(password);

      return this.currentUser;

    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);

      // Check for specific Firebase errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid username or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled. Please enable it in Firebase Console.');
      }

      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Save score to Firebase or localStorage
   */
  async saveScore(scoreData) {
    const { score, wave, wpm, accuracy } = scoreData;

    if (!this.currentUser) {
      console.warn('⚠️ No user logged in. Score not saved.');
      return false;
    }

    const scoreEntry = {
      username: this.currentUser.username,
      userId: this.currentUser.uid,
      score,
      wave,
      wpm,
      accuracy,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    try {
      if (this.enabled && this.db) {
        // Save to Firebase
        await addDoc(collection(this.db, 'scores'), scoreEntry);
        console.log('💾 Score saved to Firebase');
      }

      // Always save locally as backup
      this.saveLocalScore(scoreEntry);
      return true;

    } catch (error) {
      console.error('❌ Failed to save score to Firebase:', error.message);

      // Fallback to local storage
      this.saveLocalScore(scoreEntry);
      console.log('💾 Score saved locally');
      return true;
    }
  }

  /**
   * Get top scores from Firebase or localStorage
   * Now queries users collection to show each user's best score only
   */
  async getLeaderboard(limitCount = 10) {
    console.log(`🔍 getLeaderboard called, Firebase enabled: ${this.enabled}`);

    // If Firebase is not enabled, immediately return local scores
    if (!this.enabled || !this.db) {
      console.log('⚠️ Firebase not enabled, using local scores');
      return this.getLocalLeaderboard(limitCount);
    }

    try {
      // Get from Firebase users collection (shows each user's best score)
      const q = query(
        collection(this.db, 'users'),
        orderBy('highestScore', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const scores = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Format to match score structure expected by UI
        scores.push({
          id: doc.id,
          username: userData.username,
          userId: userData.userId || doc.id,
          score: userData.highestScore || 0,
          wave: userData.highestWave || 0,
          wpm: userData.bestWpm || 0,
          accuracy: userData.bestAccuracy || 0,
          gamesPlayed: userData.gamesPlayed || 0,
          totalScore: userData.totalScore || 0
        });
      });

      console.log(`📊 Loaded ${scores.length} users from Firebase leaderboard`);
      return scores;

    } catch (error) {
      console.error('❌ Failed to load Firebase leaderboard:', error.message);
      // Fallback to local scores on error
      return this.getLocalLeaderboard(limitCount);
    }
  }

  /**
   * Get current username
   */
  getCurrentUsername() {
    return this.currentUser?.username || this.getLocalUsername() || null;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null || this.getLocalUsername() !== null;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      if (this.enabled && this.auth.currentUser) {
        await signOut(this.auth);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.currentUser = null;
    localStorage.removeItem('dhivehi_type_username');
    localStorage.removeItem('dhivehi_type_password');
    localStorage.removeItem('dhivehi_type_user_stats');
    console.log('👋 Logged out');
  }

  /**
   * Get user stats from Firebase or localStorage
   */
  async getUserStats() {
    console.log(`🔍 getUserStats called, currentUser: ${this.currentUser?.username}, Firebase enabled: ${this.enabled}`);

    if (!this.currentUser) {
      console.log('⚠️ No current user');
      return null;
    }

    // If Firebase is not enabled, immediately return local stats
    if (!this.enabled || !this.db) {
      console.log('⚠️ Firebase not enabled, using local stats');
      return this.getLocalUserStats();
    }

    try {
      const userDoc = await getDoc(doc(this.db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        console.log('✅ Loaded user stats from Firebase');
        return userDoc.data();
      } else {
        console.log('⚠️ No user stats in Firebase, trying local');
        return this.getLocalUserStats();
      }
    } catch (error) {
      console.error('❌ Failed to load user stats from Firebase:', error);
      // Fallback to localStorage
      return this.getLocalUserStats();
    }
  }

  /**
   * Update user stats after a game
   */
  async updateUserStats(gameData) {
    if (!this.currentUser) {
      return false;
    }

    const { score, wave, wpm, accuracy } = gameData;

    try {
      if (this.enabled && this.db) {
        const userRef = doc(this.db, 'users', this.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Update existing stats
          const currentStats = userDoc.data();
          const updates = {
            gamesPlayed: increment(1),
            highestWave: Math.max(currentStats.highestWave || 0, wave),
            highestScore: Math.max(currentStats.highestScore || 0, score),
            totalScore: increment(score),
            lastPlayed: Date.now()
          };

          // Track best WPM and accuracy
          if (wpm && wpm > (currentStats.bestWpm || 0)) {
            updates.bestWpm = wpm;
          }
          if (accuracy && accuracy > (currentStats.bestAccuracy || 0)) {
            updates.bestAccuracy = accuracy;
          }

          await updateDoc(userRef, updates);
        } else {
          // Create new user stats
          await setDoc(userRef, {
            username: this.currentUser.username,
            userId: this.currentUser.uid,
            gamesPlayed: 1,
            highestWave: wave,
            highestScore: score,
            totalScore: score,
            bestWpm: wpm || 0,
            bestAccuracy: accuracy || 0,
            createdAt: Date.now(),
            lastPlayed: Date.now()
          });
        }

        console.log('📊 User stats updated in Firebase');
      }

      // Always update local stats as backup
      this.updateLocalUserStats(gameData);
      return true;

    } catch (error) {
      console.error('Failed to update user stats in Firebase:', error);

      // Fallback to local storage
      this.updateLocalUserStats(gameData);
      return true;
    }
  }

  // ==================== Local Storage Methods ====================

  /**
   * Save username to localStorage
   */
  saveLocalUsername(username) {
    localStorage.setItem('dhivehi_type_username', username);
  }

  /**
   * Get username from localStorage
   */
  getLocalUsername() {
    return localStorage.getItem('dhivehi_type_username');
  }

  /**
   * Save password to localStorage (for offline mode and auto-login)
   */
  saveLocalPassword(password) {
    localStorage.setItem('dhivehi_type_password', password);
  }

  /**
   * Get password from localStorage
   */
  getLocalPassword() {
    return localStorage.getItem('dhivehi_type_password');
  }

  /**
   * Save score to localStorage
   */
  saveLocalScore(scoreEntry) {
    try {
      const scores = JSON.parse(localStorage.getItem('dhivehi_type_scores') || '[]');
      scores.push(scoreEntry);

      // Keep only last 100 scores locally
      if (scores.length > 100) {
        scores.sort((a, b) => b.score - a.score);
        scores.splice(100);
      }

      localStorage.setItem('dhivehi_type_scores', JSON.stringify(scores));
    } catch (error) {
      console.error('Failed to save local score:', error);
    }
  }

  /**
   * Get local leaderboard from localStorage
   * Shows only the best score per user
   */
  getLocalLeaderboard(limitCount = 10) {
    try {
      const allScores = JSON.parse(localStorage.getItem('dhivehi_type_scores') || '[]');

      // Group by username and keep only the highest score
      const bestScores = {};
      allScores.forEach(score => {
        const username = score.username;
        if (!bestScores[username] || score.score > bestScores[username].score) {
          bestScores[username] = score;
        }
      });

      // Convert to array and sort by score
      const scores = Object.values(bestScores);
      scores.sort((a, b) => b.score - a.score);

      console.log(`📊 Loaded ${Math.min(scores.length, limitCount)} unique users from local scores`);
      return scores.slice(0, limitCount);
    } catch (error) {
      console.error('Failed to load local scores:', error);
      return [];
    }
  }

  /**
   * Check if Firebase is enabled
   */
  isFirebaseEnabled() {
    return this.enabled;
  }

  /**
   * Get user stats from localStorage
   */
  getLocalUserStats() {
    try {
      const stats = localStorage.getItem('dhivehi_type_user_stats');
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('Failed to load local user stats:', error);
      return null;
    }
  }

  /**
   * Update user stats in localStorage
   */
  updateLocalUserStats(gameData) {
    try {
      const { score, wave, wpm, accuracy } = gameData;
      const currentStats = this.getLocalUserStats() || {
        username: this.currentUser?.username,
        gamesPlayed: 0,
        highestWave: 0,
        highestScore: 0,
        totalScore: 0,
        createdAt: Date.now()
      };

      currentStats.gamesPlayed += 1;
      currentStats.highestWave = Math.max(currentStats.highestWave || 0, wave);
      currentStats.highestScore = Math.max(currentStats.highestScore || 0, score);
      currentStats.totalScore = (currentStats.totalScore || 0) + score;
      currentStats.lastPlayed = Date.now();

      localStorage.setItem('dhivehi_type_user_stats', JSON.stringify(currentStats));
      console.log('📊 User stats updated locally');
    } catch (error) {
      console.error('Failed to update local user stats:', error);
    }
  }
}
