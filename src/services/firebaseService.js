// src/services/firebaseService.js
import firestore from '@react-native-firebase/firestore';

// Add a new transaction
export const addTransaction = async (userId, transactionData) => {
  try {
    const docRef = await firestore()
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .add({
        ...transactionData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log('Transaction added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction: ', error);
    throw new Error(
      'Failed to add transaction. Please check your connection and try again.',
    );
  }
};

// Get all transactions for a user
export const getTransactions = async (userId, limit = 100) => {
  try {
    const snapshot = await firestore()
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const transactions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return transactions;
  } catch (error) {
    console.error('Error getting transactions: ', error);
    throw error;
  }
};

// Get transactions by type and date range
export const getTransactionsByTypeAndDate = async (
  userId,
  type,
  startDate,
  endDate,
) => {
  try {
    let query = firestore()
      .collection('users')
      .doc(userId)
      .collection('transactions');

    if (type) {
      query = query.where('type', '==', type);
    }

    if (startDate && endDate) {
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }

    const snapshot = await query.orderBy('date', 'desc').get();

    const transactions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
      });
    });

    return transactions;
  } catch (error) {
    console.error('Error getting filtered transactions: ', error);
    throw error;
  }
};

// Get financial summary
export const getFinancialSummary = async userId => {
  try {
    const transactions = await getTransactions(userId);

    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: transactions.length,
      thisMonthIncome: 0,
      thisMonthExpenses: 0,
      expensesByCategory: {},
      incomeByCategory: {},
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const isThisMonth =
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear;

      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
        if (isThisMonth) summary.thisMonthIncome += transaction.amount;

        summary.incomeByCategory[transaction.category] =
          (summary.incomeByCategory[transaction.category] || 0) +
          transaction.amount;
      } else {
        summary.totalExpenses += transaction.amount;
        if (isThisMonth) summary.thisMonthExpenses += transaction.amount;

        summary.expensesByCategory[transaction.category] =
          (summary.expensesByCategory[transaction.category] || 0) +
          transaction.amount;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpenses;

    return summary;
  } catch (error) {
    console.error('Error getting financial summary: ', error);
    throw error;
  }
};

// Delete a transaction
export const deleteTransaction = async (userId, transactionId) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(transactionId)
      .delete();

    console.log('Transaction deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting transaction: ', error);
    throw error;
  }
};

// Update a transaction
export const updateTransaction = async (userId, transactionId, updateData) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(transactionId)
      .update({
        ...updateData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log('Transaction updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating transaction: ', error);
    throw error;
  }
};
