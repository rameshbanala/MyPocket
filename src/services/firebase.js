import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Initialize Firebase collections
export const db = firestore();
export const authentication = auth();

// Collection references
export const getExpensesCollection = userId =>
  db.collection('users').doc(userId).collection('expenses');

export const getIncomesCollection = userId =>
  db.collection('users').doc(userId).collection('incomes');

export const getUserSettings = userId =>
  db.collection('users').doc(userId).collection('settings');
