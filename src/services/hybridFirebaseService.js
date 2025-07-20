// src/services/hybridFirebaseService.js (Complete User Isolation & Initial Sync)
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import localDB from './localDatabase';

class HybridFirebaseService {
  constructor() {
    this.isOnline = false;
    this.syncInProgress = false;
    this.initialSyncInProgress = false;
    this.networkUnsubscribe = null;
    this.isInitialized = false;
    this.currentUserId = null;

    this.initializeService();
  }

  async initializeService() {
    try {
      await localDB.initDatabase();
      this.isInitialized = true;
      console.log('💾 Local database ready for hybrid service');

      this.initNetworkListener();
      console.log('🔗 Hybrid Firebase service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize hybrid service:', error);
    }
  }

  initNetworkListener() {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      console.log(`📶 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

      if (
        wasOffline &&
        this.isOnline &&
        !this.syncInProgress &&
        this.isInitialized &&
        this.currentUserId
      ) {
        setTimeout(() => {
          this.syncPendingChanges();
        }, 2000);
      }
    });
  }

  // Initialize user session with proper data handling
  async initializeUser(userId) {
    try {
      console.log(`👤 Initializing user session: ${userId}`);

      if (this.currentUserId && this.currentUserId !== userId) {
        console.log(`🔄 User changed from ${this.currentUserId} to ${userId}`);
        // Clear previous user's local data if different user
        // await localDB.clearUserData(this.currentUserId);
      }

      this.currentUserId = userId;
      const userStatus = await localDB.setCurrentUser(userId);

      if (userStatus.needsInitialSync && this.isOnline) {
        console.log('🔄 Performing initial sync for new user...');
        await this.performInitialSync(userId);
      } else if (this.isOnline) {
        console.log('🔄 Performing incremental sync...');
        setTimeout(() => {
          this.performIncrementalSync(userId);
        }, 1000);
      }

      return userStatus;
    } catch (error) {
      console.error('❌ Error initializing user:', error);
      throw error;
    }
  }

  // Initial sync: Download all user data from cloud
  async performInitialSync(userId) {
    if (this.initialSyncInProgress) {
      console.log('⏳ Initial sync already in progress');
      return;
    }

    this.initialSyncInProgress = true;
    console.log('🔄 Starting initial sync for user:', userId);

    try {
      // Get all transactions from Firebase for this user
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .get();

      console.log(
        `☁️ Retrieved ${snapshot.size} transactions from cloud for initial sync`,
      );

      if (snapshot.size > 0) {
        const cloudTransactions = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          cloudTransactions.push({
            id: doc.id,
            userId: userId,
            type: data.type,
            amount: data.amount,
            category: data.category,
            categoryName: data.categoryName,
            categoryIcon: data.categoryIcon,
            description: data.description,
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        // Batch insert all transactions locally
        await localDB.batchInsertTransactions(cloudTransactions);

        // Update last sync time
        await localDB.updateLastSyncTime(userId);

        console.log(
          `✅ Initial sync completed: ${cloudTransactions.length} transactions synced`,
        );
      } else {
        console.log('📭 No cloud data found for user - starting fresh');
        await localDB.updateLastSyncTime(userId);
      }
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      throw error;
    } finally {
      this.initialSyncInProgress = false;
    }
  }

  // Incremental sync: Only sync changes since last sync
  async performIncrementalSync(userId) {
    try {
      console.log('🔄 Starting incremental sync...');

      const lastSyncTime = await localDB.getLastSyncTime(userId);

      if (!lastSyncTime) {
        console.log(
          '📝 No last sync time found, performing initial sync instead',
        );
        return this.performInitialSync(userId);
      }

      console.log(`🕐 Last sync: ${lastSyncTime.toISOString()}`);

      // Get transactions updated since last sync
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('updatedAt', '>', lastSyncTime)
        .orderBy('updatedAt', 'desc')
        .get();

      console.log(
        `☁️ Found ${snapshot.size} updated transactions since last sync`,
      );

      if (snapshot.size > 0) {
        const updatedTransactions = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          updatedTransactions.push({
            id: doc.id,
            userId: userId,
            type: data.type,
            amount: data.amount,
            category: data.category,
            categoryName: data.categoryName,
            categoryIcon: data.categoryIcon,
            description: data.description,
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        // Update local database with changes
        await localDB.batchInsertTransactions(updatedTransactions);

        console.log(
          `✅ Incremental sync completed: ${updatedTransactions.length} transactions updated`,
        );
      }

      // Update last sync time
      await localDB.updateLastSyncTime(userId);

      // Also sync pending local changes to cloud
      await this.syncPendingChanges();
    } catch (error) {
      console.error('❌ Incremental sync failed:', error);
    }
  }

  // Add transaction with user validation
  async addTransaction(userId, transactionData) {
    try {
      if (!this.isInitialized) {
        await this.initializeService();
      }

      if (!userId) {
        throw new Error('UserId is required');
      }

      console.log(`💾 Adding transaction for user ${userId}...`);

      const localTransaction = {
        ...transactionData,
        id: localDB.generateUUID(),
        userId: userId,
      };

      const transactionId = await localDB.addTransaction(localTransaction);

      if (this.isOnline) {
        console.log('🌐 Online - attempting immediate sync...');
        setTimeout(() => {
          this.syncPendingChanges();
        }, 500);
      }

      return transactionId;
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      throw error;
    }
  }

  // Get transactions with user validation
  async getTransactions(userId, limit = 50) {
    try {
      if (!this.isInitialized) {
        await this.initializeService();
      }

      if (!userId) {
        throw new Error('UserId is required');
      }

      console.log(`📊 Getting transactions for user ${userId}...`);

      const localTransactions = await localDB.getTransactions(userId, limit);

      // If online and no sync in progress, perform incremental sync in background
      if (
        this.isOnline &&
        !this.syncInProgress &&
        !this.initialSyncInProgress
      ) {
        setTimeout(() => {
          this.performIncrementalSync(userId);
        }, 1000);
      }

      return localTransactions.map(this.formatTransactionFromDB);
    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      throw error;
    }
  }

  // Get financial summary with user validation
  async getFinancialSummary(userId) {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }

      const transactions = await this.getTransactions(userId);
      console.log(
        `📊 Calculating summary from ${transactions.length} transactions for user ${userId}`,
      );
      return this.calculateSummaryFromTransactions(transactions);
    } catch (error) {
      console.error('❌ Error getting financial summary:', error);
      throw error;
    }
  }

  // Enhanced sync pending changes
  async syncPendingChanges() {
    if (this.syncInProgress || !this.isOnline || !this.isInitialized) {
      console.log(
        '⏳ Sync skipped: inProgress=',
        this.syncInProgress,
        'online=',
        this.isOnline,
        'initialized=',
        this.isInitialized,
      );
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync process...');

    try {
      const pendingItems = await localDB.getPendingSyncItems();
      console.log(`📋 Found ${pendingItems.length} items to sync`);

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
          await localDB.updateSyncItemStatus(item.id, 'completed');
          console.log(`✅ Synced item ${item.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync item ${item.id}:`, error);
          await localDB.updateSyncItemStatus(
            item.id,
            'failed',
            item.retryCount + 1,
          );
        }
      }

      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('❌ Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncItem(syncItem) {
    const { operation, tableName, recordId, data } = syncItem;
    const parsedData = data ? JSON.parse(data) : null;

    console.log(`🔄 Syncing ${operation} for ${tableName}:${recordId}`);

    switch (operation) {
      case 'create':
        await this.syncCreate(tableName, recordId, parsedData);
        break;
      case 'update':
        await this.syncUpdate(tableName, recordId, parsedData);
        break;
      case 'delete':
        await this.syncDelete(tableName, recordId, parsedData);
        break;
      default:
        throw new Error(`Unknown sync operation: ${operation}`);
    }

    if (tableName === 'transactions') {
      await localDB.updateTransactionSyncStatus(recordId, 'synced');
    }
  }
  // Update transaction with proper validation and sync
  async updateTransaction(transactionId, userId, updateData) {
    try {
      if (!userId || !transactionId) {
        throw new Error('UserId and transactionId are required');
      }

      console.log(
        `✏️ Updating transaction ${transactionId} for user ${userId}`,
      );

      // Prepare update data with validation
      const validatedData = {
        ...updateData,
        userId,
        updatedAt: new Date(),
      };

      // Update in local database
      await localDB.updateTransaction(transactionId, validatedData);

      // If online, try to sync immediately
      if (this.isOnline) {
        setTimeout(() => {
          this.syncPendingChanges();
        }, 500);
      }

      console.log(`✅ Transaction ${transactionId} updated successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      throw error;
    }
  }

  async syncUpdate(tableName, recordId, data) {
    if (tableName === 'transactions') {
      try {
        console.log(
          `🔄 Updating Firebase transaction ${recordId} for user ${data.userId}`,
        );

        // Prepare the update data for Firebase
        const updateData = {
          type: data.type,
          amount: Number(data.amount),
          category: data.category,
          categoryName: data.categoryName || '',
          categoryIcon: data.categoryIcon || '',
          description: data.description || '',
          date: data.date instanceof Date ? data.date : new Date(data.date),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        // Update in Firebase
        await firestore()
          .collection('users')
          .doc(data.userId)
          .collection('transactions')
          .doc(recordId)
          .update(updateData);

        console.log(
          `✅ Successfully updated transaction in Firebase: ${recordId}`,
        );
      } catch (error) {
        console.error(
          `❌ Firebase update failed for transaction ${recordId}:`,
          error,
        );
        throw error;
      }
    }
  }

  // Fixed sync create function
  async syncCreate(tableName, recordId, data) {
    if (tableName === 'transactions') {
      try {
        console.log(
          `🔄 Creating Firebase transaction ${recordId} for user ${data.userId}`,
        );

        const createData = {
          type: data.type,
          amount: Number(data.amount),
          category: data.category,
          categoryName: data.categoryName || '',
          categoryIcon: data.categoryIcon || '',
          description: data.description || '',
          date: data.date instanceof Date ? data.date : new Date(data.date),
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await firestore()
          .collection('users')
          .doc(data.userId)
          .collection('transactions')
          .doc(recordId)
          .set(createData);

        console.log(
          `✅ Successfully created transaction in Firebase: ${recordId}`,
        );
      } catch (error) {
        console.error(
          `❌ Firebase create failed for transaction ${recordId}:`,
          error,
        );
        throw error;
      }
    }
  }

  // Fixed sync delete function
  async syncDelete(tableName, recordId, data) {
    if (tableName === 'transactions' && data && data.userId) {
      try {
        console.log(
          `🔄 Deleting Firebase transaction ${recordId} for user ${data.userId}`,
        );

        await firestore()
          .collection('users')
          .doc(data.userId)
          .collection('transactions')
          .doc(recordId)
          .delete();

        console.log(
          `✅ Successfully deleted transaction from Firebase: ${recordId}`,
        );
      } catch (error) {
        console.error(
          `❌ Firebase delete failed for transaction ${recordId}:`,
          error,
        );
        throw error;
      }
    }
  }
  // Force manual sync (for testing)
  async forcePendingSync() {
    console.log('🔧 Forcing manual sync...');
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    await this.syncPendingChanges();
  }

  // Get sync status for debugging
  async getSyncStatus() {
    try {
      const pendingItems = await localDB.getPendingSyncItems();
      return {
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        pendingItemsCount: pendingItems.length,
        currentUserId: this.currentUserId,
        isInitialized: this.isInitialized,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  calculateSummaryFromTransactions(transactions) {
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      thisMonthIncome: 0,
      thisMonthExpenses: 0,
      transactionCount: transactions.length,
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
  }
  // Add to src/services/hybridFirebaseService.js

  // Delete transaction with proper user validation
  async deleteTransaction(transactionId, userId) {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }

      console.log(
        `🗑️ Deleting transaction ${transactionId} for user ${userId}`,
      );

      // Delete from local database
      await localDB.deleteTransaction(transactionId, userId);

      // If online, try to sync immediately
      if (this.isOnline) {
        setTimeout(() => {
          this.syncPendingChanges();
        }, 500);
      }

      console.log(`✅ Transaction ${transactionId} marked for deletion`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      throw error;
    }
  }

  // Get transactions by date range
  async getTransactionsByDateRange(userId, startDate, endDate) {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }

      const allTransactions = await localDB.getTransactions(userId, 1000);

      const filtered = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      return filtered.map(this.formatTransactionFromDB);
    } catch (error) {
      console.error('❌ Error getting transactions by date range:', error);
      throw error;
    }
  }
  async getTransactionById(transactionId, userId) {
    try {
      if (!userId || !transactionId) {
        throw new Error('UserId and transactionId are required');
      }

      const transaction = await localDB.getTransactionById(
        transactionId,
        userId,
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return this.formatTransactionFromDB(transaction);
    } catch (error) {
      console.error('❌ Error getting transaction by ID:', error);
      throw error;
    }
  }
  // Validate transaction data before update
  validateTransactionData(data) {
    const errors = [];

    if (
      !data.amount ||
      isNaN(parseFloat(data.amount)) ||
      parseFloat(data.amount) <= 0
    ) {
      errors.push('Valid amount is required');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Valid transaction type is required');
    }

    if (!data.date || isNaN(new Date(data.date).getTime())) {
      errors.push('Valid date is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  // Get transactions by category
  async getTransactionsByCategory(userId, category, type = null) {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }

      const allTransactions = await localDB.getTransactions(userId, 1000);

      let filtered = allTransactions.filter(
        transaction => transaction.category === category,
      );

      if (type) {
        filtered = filtered.filter(transaction => transaction.type === type);
      }

      return filtered.map(this.formatTransactionFromDB);
    } catch (error) {
      console.error('❌ Error getting transactions by category:', error);
      throw error;
    }
  }

  // Search transactions
  async searchTransactions(userId, searchQuery) {
    try {
      if (!userId || !searchQuery) {
        return [];
      }

      const allTransactions = await localDB.getTransactions(userId, 1000);

      const filtered = allTransactions.filter(transaction => {
        const categoryData = this.getCategoryData(
          transaction.category,
          transaction.type,
        );
        return (
          categoryData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.description &&
            transaction.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          transaction.amount.toString().includes(searchQuery)
        );
      });

      return filtered.map(this.formatTransactionFromDB);
    } catch (error) {
      console.error('❌ Error searching transactions:', error);
      throw error;
    }
  }

  // Helper function to get category data
  getCategoryData(categoryId, type) {
    const {
      EXPENSE_CATEGORIES,
      INCOME_CATEGORIES,
    } = require('../utils/categories');
    const categories =
      type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return (
      categories.find(cat => cat.id === categoryId) || {
        name: 'Unknown',
        icon: '❓',
      }
    );
  }

  formatTransactionFromDB(dbTransaction) {
    return {
      ...dbTransaction,
      date: new Date(dbTransaction.date),
      createdAt: new Date(dbTransaction.createdAt),
      amount: parseFloat(dbTransaction.amount),
    };
  }

  // User logout cleanup
  async handleUserLogout() {
    if (this.currentUserId) {
      console.log(`🚪 Handling logout for user: ${this.currentUserId}`);
      // Optionally clear user data or keep it for next login
      // await localDB.clearUserData(this.currentUserId);
      this.currentUserId = null;
    }
  }

  destroy() {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
  }
}

export default new HybridFirebaseService();
