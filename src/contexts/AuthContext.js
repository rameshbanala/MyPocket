// src/contexts/AuthContext.js (Updated with User Session Management)
import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import hybridFirebaseService from '../services/hybridFirebaseService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialSyncCompleted, setInitialSyncCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      console.log(
        '🔐 Auth state changed:',
        firebaseUser ? 'User logged in' : 'User logged out',
      );

      if (firebaseUser) {
        // User logged in - initialize their session
        try {
          setUser(firebaseUser);
          console.log('👤 Initializing user session...');

          const userStatus = await hybridFirebaseService.initializeUser(
            firebaseUser.uid,
          );

          if (userStatus.needsInitialSync) {
            console.log('🔄 First time user - initial sync in progress...');
            setInitialSyncCompleted(false);
            // Initial sync happens automatically in hybridFirebaseService
            // We'll set this to true after a reasonable delay
            setTimeout(() => {
              setInitialSyncCompleted(true);
            }, 3000);
          } else {
            console.log('✅ Returning user - data available locally');
            setInitialSyncCompleted(true);
          }
        } catch (error) {
          console.error('❌ Error initializing user session:', error);
          setInitialSyncCompleted(true); // Allow app to continue
        }
      } else {
        // User logged out
        if (user) {
          console.log('🚪 User logged out, cleaning up session...');
          await hybridFirebaseService.handleUserLogout();
        }
        setUser(null);
        setInitialSyncCompleted(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const signIn = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password) => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    initialSyncCompleted,
    signIn,
    signUp,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
