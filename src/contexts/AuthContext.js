// src/contexts/AuthContext.js (Enhanced with Name Support)
import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialSyncCompleted, setInitialSyncCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      console.log(
        '🔐 Auth state changed:',
        firebaseUser ? 'User logged in' : 'User logged out',
      );

      if (firebaseUser) {
        try {
          setUser(firebaseUser);

          // Fetch user profile data
          await fetchUserProfile(firebaseUser.uid);

          console.log('👤 Initializing user session...');
          const userStatus = await hybridFirebaseService.initializeUser(
            firebaseUser.uid,
          );

          if (userStatus.needsInitialSync) {
            console.log('🔄 First time user - initial sync in progress...');
            setInitialSyncCompleted(false);
            setTimeout(() => {
              setInitialSyncCompleted(true);
            }, 3000);
          } else {
            console.log('✅ Returning user - data available locally');
            setInitialSyncCompleted(true);
          }
        } catch (error) {
          console.error('❌ Error initializing user session:', error);
          setInitialSyncCompleted(true);
        }
      } else {
        if (user) {
          console.log('🚪 User logged out, cleaning up session...');
          await hybridFirebaseService.handleUserLogout();
        }
        setUser(null);
        setUserProfile(null);
        setInitialSyncCompleted(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Fetch user profile from Firestore
  const fetchUserProfile = async userId => {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();

      if (userDoc.exists) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
      } else {
        console.log('👤 No user profile found');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (userId, profileData) => {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .set({
          ...profileData,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      setUserProfile(profileData);
      console.log('✅ User profile created successfully');
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async updateData => {
    try {
      if (!user) throw new Error('No user logged in');

      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      setUserProfile(prev => ({ ...prev, ...updateData }));
      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, name) => {
    try {
      // Create Firebase auth user
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // Create user profile in Firestore
      await createUserProfile(userCredential.user.uid, {
        name: name.trim(),
        email: email,
        photoURL: null,
      });

      // Update Firebase auth profile
      await userCredential.user.updateProfile({
        displayName: name.trim(),
      });
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
    userProfile,
    loading,
    initialSyncCompleted,
    signIn,
    signUp,
    signOut: handleSignOut,
    updateUserProfile,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
