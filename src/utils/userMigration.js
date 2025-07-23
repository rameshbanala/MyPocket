// src/utils/userMigration.js
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const migrateExistingUser = async () => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const userDocRef = firestore().collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.log('🔄 Migrating existing user...');
      
      const profileData = {
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await userDocRef.set(profileData);
      console.log('✅ User migration completed');
      
      return profileData;
    }
    
    return userDoc.data();
  } catch (error) {
    console.error('❌ User migration failed:', error);
    throw error;
  }
};
