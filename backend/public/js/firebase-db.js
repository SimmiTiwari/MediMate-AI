/**
 * MediMate AI - Cloud Firestore & Authentication Service Layer
 * Supports real Firebase Cloud Services with automatic graceful local offline fallback.
 */

class MediMateDB {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.isRealFirebase = false;
    this.init();
  }

  init() {
    const config = window.MediMateConfig.getFirebaseConfig();
    
    // Check if Firebase Compat SDK is present in window
    if (typeof firebase !== 'undefined' && config && config.apiKey && !config.apiKey.includes('Dummy')) {
      try {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.isRealFirebase = true;
        console.log('[MediMate Cloud] Connected to Firebase Cloud Services (Spark Plan)');
      } catch (err) {
        console.warn('[MediMate Cloud] Firebase init error, falling back to local client store:', err);
        this.isRealFirebase = false;
      }
    } else {
      console.log('[MediMate Cloud] Operating in Local Database Mode (Zero-Config ready)');
      this.isRealFirebase = false;
    }
  }

  /* =========================================================================
     Authentication Operations
     ========================================================================= */

  async register(fullName, email, password) {
    if (this.isRealFirebase) {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update display name
      await user.updateProfile({ displayName: fullName });

      // Save user profile in Firestore
      await this.db.collection('users').doc(user.uid).set({
        fullName,
        email,
        createdAt: new Date().toISOString()
      });

      return { uid: user.uid, email: user.email, displayName: fullName };
    } else {
      // Offline fallback auth storage
      const users = JSON.parse(localStorage.getItem('mm_users') || '[]');
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new Error('An account with this email already exists.');
      }

      const uid = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newUser = {
        uid,
        email,
        fullName,
        passwordHash: btoa(password), // Simulated hash for local demo
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('mm_users', JSON.stringify(users));

      const sessionUser = { uid, email, displayName: fullName };
      localStorage.setItem('mm_current_session', JSON.stringify(sessionUser));
      return sessionUser;
    }
  }

  async login(email, password) {
    if (this.isRealFirebase) {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      return { uid: user.uid, email: user.email, displayName: user.displayName || email.split('@')[0] };
    } else {
      const users = JSON.parse(localStorage.getItem('mm_users') || '[]');
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found || found.passwordHash !== btoa(password)) {
        throw new Error('Invalid email or password. Please try again.');
      }
      const sessionUser = { uid: found.uid, email: found.email, displayName: found.fullName };
      localStorage.setItem('mm_current_session', JSON.stringify(sessionUser));
      return sessionUser;
    }
  }

  async logout() {
    if (this.isRealFirebase) {
      await this.auth.signOut();
    }
    localStorage.removeItem('mm_current_session');
  }

  getCurrentUser() {
    if (this.isRealFirebase && this.auth && this.auth.currentUser) {
      const u = this.auth.currentUser;
      return { uid: u.uid, email: u.email, displayName: u.displayName || u.email.split('@')[0] };
    }
    const session = localStorage.getItem('mm_current_session');
    return session ? JSON.parse(session) : null;
  }

  onAuthStateChanged(callback) {
    if (this.isRealFirebase && this.auth) {
      this.auth.onAuthStateChanged(user => {
        if (user) {
          callback({ uid: user.uid, email: user.email, displayName: user.displayName || user.email.split('@')[0] });
        } else {
          callback(null);
        }
      });
    } else {
      // Simulate listener for local state
      const current = this.getCurrentUser();
      setTimeout(() => callback(current), 50);
    }
  }

  /* =========================================================================
     Health Logs Operations (users/{uid}/healthLogs)
     ========================================================================= */

  async saveHealthLog(userId, logData) {
    const timestamp = new Date().toISOString();
    const payload = {
      ...logData,
      updatedAt: timestamp
    };

    if (this.isRealFirebase) {
      if (logData.id) {
        await this.db.collection('users').doc(userId).collection('healthLogs').doc(logData.id).update(payload);
        return { id: logData.id, ...payload };
      } else {
        payload.createdAt = timestamp;
        const ref = await this.db.collection('users').doc(userId).collection('healthLogs').add(payload);
        return { id: ref.id, ...payload };
      }
    } else {
      const key = `mm_logs_${userId}`;
      const logs = JSON.parse(localStorage.getItem(key) || '[]');
      if (logData.id) {
        const idx = logs.findIndex(l => l.id === logData.id);
        if (idx !== -1) {
          logs[idx] = { ...logs[idx], ...payload };
          localStorage.setItem(key, JSON.stringify(logs));
          return logs[idx];
        }
      }
      payload.id = 'log_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      payload.createdAt = timestamp;
      logs.push(payload);
      localStorage.setItem(key, JSON.stringify(logs));
      return payload;
    }
  }

  async getHealthLogs(userId) {
    if (this.isRealFirebase) {
      const snap = await this.db.collection('users').doc(userId).collection('healthLogs').orderBy('date', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const logs = JSON.parse(localStorage.getItem(`mm_logs_${userId}`) || '[]');
      return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  async deleteHealthLog(userId, logId) {
    if (this.isRealFirebase) {
      await this.db.collection('users').doc(userId).collection('healthLogs').doc(logId).delete();
    } else {
      const key = `mm_logs_${userId}`;
      const logs = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = logs.filter(l => l.id !== logId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return true;
  }

  /* =========================================================================
     Journal Entries Operations (users/{uid}/journalEntries)
     ========================================================================= */

  async saveJournalEntry(userId, entryData) {
    const timestamp = new Date().toISOString();
    const payload = {
      ...entryData,
      updatedAt: timestamp
    };

    if (this.isRealFirebase) {
      if (entryData.id) {
        await this.db.collection('users').doc(userId).collection('journalEntries').doc(entryData.id).update(payload);
        return { id: entryData.id, ...payload };
      } else {
        payload.createdAt = timestamp;
        const ref = await this.db.collection('users').doc(userId).collection('journalEntries').add(payload);
        return { id: ref.id, ...payload };
      }
    } else {
      const key = `mm_journal_${userId}`;
      const entries = JSON.parse(localStorage.getItem(key) || '[]');
      if (entryData.id) {
        const idx = entries.findIndex(e => e.id === entryData.id);
        if (idx !== -1) {
          entries[idx] = { ...entries[idx], ...payload };
          localStorage.setItem(key, JSON.stringify(entries));
          return entries[idx];
        }
      }
      payload.id = 'entry_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      payload.createdAt = timestamp;
      entries.push(payload);
      localStorage.setItem(key, JSON.stringify(entries));
      return payload;
    }
  }

  async getJournalEntries(userId) {
    if (this.isRealFirebase) {
      const snap = await this.db.collection('users').doc(userId).collection('journalEntries').orderBy('date', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const entries = JSON.parse(localStorage.getItem(`mm_journal_${userId}`) || '[]');
      return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  async deleteJournalEntry(userId, entryId) {
    if (this.isRealFirebase) {
      await this.db.collection('users').doc(userId).collection('journalEntries').doc(entryId).delete();
    } else {
      const key = `mm_journal_${userId}`;
      const entries = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = entries.filter(e => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return true;
  }

  /* =========================================================================
     AI Wellness Summaries (users/{uid}/summaries)
     ========================================================================= */

  async saveSummary(userId, summaryData) {
    const timestamp = new Date().toISOString();
    const payload = {
      ...summaryData,
      createdAt: timestamp
    };

    if (this.isRealFirebase) {
      const ref = await this.db.collection('users').doc(userId).collection('summaries').add(payload);
      return { id: ref.id, ...payload };
    } else {
      const key = `mm_summaries_${userId}`;
      const summaries = JSON.parse(localStorage.getItem(key) || '[]');
      payload.id = 'sum_' + Date.now().toString(36);
      summaries.push(payload);
      localStorage.setItem(key, JSON.stringify(summaries));
      return payload;
    }
  }

  async getSummaries(userId) {
    if (this.isRealFirebase) {
      const snap = await this.db.collection('users').doc(userId).collection('summaries').orderBy('createdAt', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const summaries = JSON.parse(localStorage.getItem(`mm_summaries_${userId}`) || '[]');
      return summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  /* =========================================================================
     Wellness Reminders (users/{uid}/reminders)
     ========================================================================= */

  async saveReminder(userId, reminderData) {
    const timestamp = new Date().toISOString();
    const payload = {
      ...reminderData,
      updatedAt: timestamp
    };

    if (this.isRealFirebase) {
      if (reminderData.id) {
        await this.db.collection('users').doc(userId).collection('reminders').doc(reminderData.id).update(payload);
        return { id: reminderData.id, ...payload };
      } else {
        payload.createdAt = timestamp;
        const ref = await this.db.collection('users').doc(userId).collection('reminders').add(payload);
        return { id: ref.id, ...payload };
      }
    } else {
      const key = `mm_reminders_${userId}`;
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      if (reminderData.id) {
        const idx = items.findIndex(r => r.id === reminderData.id);
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...payload };
          localStorage.setItem(key, JSON.stringify(items));
          return items[idx];
        }
      }
      payload.id = 'rem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      payload.createdAt = timestamp;
      items.push(payload);
      localStorage.setItem(key, JSON.stringify(items));
      return payload;
    }
  }

  async getReminders(userId) {
    if (this.isRealFirebase) {
      const snap = await this.db.collection('users').doc(userId).collection('reminders').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return JSON.parse(localStorage.getItem(`mm_reminders_${userId}`) || '[]');
    }
  }

  async deleteReminder(userId, reminderId) {
    if (this.isRealFirebase) {
      await this.db.collection('users').doc(userId).collection('reminders').doc(reminderId).delete();
    } else {
      const key = `mm_reminders_${userId}`;
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = items.filter(r => r.id !== reminderId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return true;
  }
}

window.mediMateDB = new MediMateDB();
