import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, updateProfile } from 'firebase/auth';
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
   * Register or login with username only
   * Uses Firebase Anonymous Auth + displayName for username
   */
  async registerUsername(username) {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    const trimmedUsername = username.trim();

    // Validate username (alphanumeric, spaces, basic Thaana)
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      throw new Error('Username must be between 2 and 20 characters');
    }

    try {
      if (this.enabled) {
        // Firebase authentication
        const userCredential = await signInAnonymously(this.auth);
        await updateProfile(userCredential.user, {
          displayName: trimmedUsername
        });

        this.currentUser = {
          uid: userCredential.user.uid,
          username: trimmedUsername
        };

        console.log(`✅ Logged in as ${trimmedUsername}`);
      } else {
        // Offline mode - just store locally
        this.currentUser = {
          uid: 'local_' + Date.now(),
          username: trimmedUsername
        };
        console.log(`✅ Playing as ${trimmedUsername} (offline mode)`);
      }

      // Save username to localStorage
      this.saveLocalUsername(trimmedUsername);

      return this.currentUser;

    } catch (error) {
      console.error('❌ Authentication failed:', error.message);

      // Fallback to offline mode
      this.currentUser = {
        uid: 'local_' + Date.now(),
        username: trimmedUsername
      };
      this.saveLocalUsername(trimmedUsername);

      return this.currentUser;
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
   */
  async getLeaderboard(limitCount = 10) {
    try {
      if (this.enabled && this.db) {
        // Get from Firebase
        const q = query(
          collection(this.db, 'scores'),
          orderBy('score', 'desc'),
          limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const scores = [];

        querySnapshot.forEach((doc) => {
          scores.push({ id: doc.id, ...doc.data() });
        });

        console.log(`📊 Loaded ${scores.length} scores from Firebase`);
        return scores;
      }
    } catch (error) {
      console.error('❌ Failed to load Firebase leaderboard:', error.message);
    }

    // Fallback to local scores
    return this.getLocalLeaderboard(limitCount);
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
    localStorage.removeItem('dhivehi_type_user_stats');
    console.log('👋 Logged out');
  }

  /**
   * Get user stats from Firebase or localStorage
   */
  async getUserStats() {
    if (!this.currentUser) {
      return null;
    }

    try {
      if (this.enabled && this.db) {
        const userDoc = await getDoc(doc(this.db, 'users', this.currentUser.uid));
        if (userDoc.exists()) {
          return userDoc.data();
        }
      }
    } catch (error) {
      console.error('Failed to load user stats from Firebase:', error);
    }

    // Fallback to localStorage
    return this.getLocalUserStats();
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
          await updateDoc(userRef, {
            gamesPlayed: increment(1),
            highestWave: Math.max(currentStats.highestWave || 0, wave),
            highestScore: Math.max(currentStats.highestScore || 0, score),
            totalScore: increment(score),
            lastPlayed: Date.now()
          });
        } else {
          // Create new user stats
          await setDoc(userRef, {
            username: this.currentUser.username,
            userId: this.currentUser.uid,
            gamesPlayed: 1,
            highestWave: wave,
            highestScore: score,
            totalScore: score,
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
   */
  getLocalLeaderboard(limitCount = 10) {
    try {
      const scores = JSON.parse(localStorage.getItem('dhivehi_type_scores') || '[]');
      scores.sort((a, b) => b.score - a.score);
      console.log(`📊 Loaded ${Math.min(scores.length, limitCount)} local scores`);
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
