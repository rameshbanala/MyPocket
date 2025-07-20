// src/services/localDatabase.js (Updated with User Isolation)
import SQLite from 'react-native-sqlite-storage';
import { DATABASE_SCHEMA } from '../database/schema';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

class LocalDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.currentUserId = null;
  }

  async initDatabase() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initializeDatabase();
    return this.initPromise;
  }

  async _initializeDatabase() {
    try {
      console.log('🔄 Initializing SQLite database...');

      this.db = await SQLite.openDatabase({
        name: 'MyPocketDB.db',
        location: 'default',
        createFromLocation: '~MyPocketDB.db',
      });

      if (!this.db) {
        throw new Error('Failed to open database connection');
      }

      await this.createTables();
      this.isInitialized = true;

      console.log('✅ SQLite database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  async createTables() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      for (const [tableName, schema] of Object.entries(DATABASE_SCHEMA)) {
        console.log(`Creating table: ${tableName}`);
        await this.db.executeSql(schema);
      }
      console.log('✅ All tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      await this.initDatabase();
    }

    if (!this.db) {
      throw new Error('Database initialization failed');
    }
  }

  // Set current user (important for user isolation)
  async setCurrentUser(userId) {
    this.currentUserId = userId;
    console.log(`👤 Current user set to: ${userId}`);

    // Check if this is the first time this user is using the app locally
    const hasLocalData = await this.hasUserData(userId);
    if (!hasLocalData) {
      console.log('🔄 First time user - need initial sync');
      return { needsInitialSync: true };
    }

    console.log('✅ User has local data');
    return { needsInitialSync: false };
  }

  // Check if user has any data locally
  async hasUserData(userId) {
    await this.ensureInitialized();

    try {
      const query = `
        SELECT COUNT(*) as count FROM transactions 
        WHERE userId = ? AND isDeleted = 0
      `;

      const [results] = await this.db.executeSql(query, [userId]);
      const count = results.rows.item(0).count;

      console.log(`📊 User ${userId} has ${count} local transactions`);
      return count > 0;
    } catch (error) {
      console.error('❌ Error checking user data:', error);
      return false;
    }
  }

  // Get last sync timestamp for user
  async getLastSyncTime(userId) {
    await this.ensureInitialized();

    try {
      const query = `
        SELECT value FROM app_settings 
        WHERE key = ?
      `;

      const [results] = await this.db.executeSql(query, [`lastSync_${userId}`]);

      if (results.rows.length > 0) {
        return new Date(results.rows.item(0).value);
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }

  // Update last sync timestamp for user
  async updateLastSyncTime(userId) {
    await this.ensureInitialized();

    try {
      const query = `
        INSERT OR REPLACE INTO app_settings (key, value, updatedAt)
        VALUES (?, ?, ?)
      `;

      const now = new Date().toISOString();
      await this.db.executeSql(query, [`lastSync_${userId}`, now, now]);

      console.log(`⏰ Updated last sync time for user ${userId}`);
    } catch (error) {
      console.error('❌ Error updating last sync time:', error);
    }
  }

  // Clear all user data (when user logs out)
  async clearUserData(userId) {
    await this.ensureInitialized();

    try {
      const queries = [
        `DELETE FROM transactions WHERE userId = ?`,
        `DELETE FROM sync_queue WHERE recordId IN (SELECT id FROM transactions WHERE userId = ?)`,
        `DELETE FROM app_settings WHERE key LIKE ?`,
      ];

      await this.db.executeSql(queries[0], [userId]);
      await this.db.executeSql(queries[1], [userId]);
      await this.db.executeSql(queries[2], [`%${userId}%`]);

      console.log(`🗑️ Cleared all data for user ${userId}`);
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      throw error;
    }
  }

  // Batch insert transactions from cloud (for initial sync)
  async batchInsertTransactions(transactions) {
    await this.ensureInitialized();

    if (!transactions || transactions.length === 0) {
      console.log('📦 No transactions to batch insert');
      return;
    }

    try {
      console.log(
        `📦 Batch inserting ${transactions.length} transactions from cloud`,
      );

      // Use transaction for batch operations
      await this.db.transaction(async tx => {
        const query = `
          INSERT OR REPLACE INTO transactions 
          (id, userId, type, amount, category, categoryName, categoryIcon, description, date, createdAt, updatedAt, syncStatus)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const transaction of transactions) {
          const values = [
            transaction.id,
            transaction.userId,
            transaction.type,
            transaction.amount,
            transaction.category,
            transaction.categoryName || '',
            transaction.categoryIcon || '',
            transaction.description || '',
            transaction.date instanceof Date
              ? transaction.date.toISOString()
              : transaction.date,
            transaction.createdAt instanceof Date
              ? transaction.createdAt.toISOString()
              : new Date().toISOString(),
            transaction.updatedAt instanceof Date
              ? transaction.updatedAt.toISOString()
              : new Date().toISOString(),
            'synced', // Mark as synced since coming from cloud
          ];

          await tx.executeSql(query, values);
        }
      });

      console.log(
        `✅ Successfully batch inserted ${transactions.length} transactions`,
      );
    } catch (error) {
      console.error('❌ Error batch inserting transactions:', error);
      throw error;
    }
  }
  async getTransactionById(transactionId, userId) {
    await this.ensureInitialized();

    if (!userId || !transactionId) {
      throw new Error('UserId and transactionId are required');
    }

    try {
      const query = `
      SELECT * FROM transactions 
      WHERE id = ? AND userId = ? AND isDeleted = 0
    `;

      const [results] = await this.db.executeSql(query, [
        transactionId,
        userId,
      ]);

      if (results.rows.length === 0) {
        return null;
      }

      console.log(
        `📊 Retrieved transaction ${transactionId} for user ${userId}`,
      );
      return results.rows.item(0);
    } catch (error) {
      console.error('❌ Error getting transaction by ID:', error);
      throw error;
    }
  }

  // Get transactions with proper user isolation
  async getTransactions(userId, limit = 50) {
    await this.ensureInitialized();

    if (!userId) {
      console.warn('⚠️ No userId provided to getTransactions');
      return [];
    }

    try {
      const query = `
        SELECT * FROM transactions 
        WHERE userId = ? AND isDeleted = 0 
        ORDER BY date DESC 
        LIMIT ?
      `;

      const [results] = await this.db.executeSql(query, [userId, limit]);
      const transactions = this.processResults(results);

      console.log(
        `📊 Retrieved ${transactions.length} transactions for user ${userId}`,
      );
      return transactions;
    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      throw error;
    }
  }

  // Add transaction with user validation
  async addTransaction(transaction) {
    await this.ensureInitialized();

    if (!transaction.userId) {
      throw new Error('Transaction must have userId');
    }

    const transactionId = transaction.id || this.generateUUID();

    try {
      const query = `
        INSERT INTO transactions 
        (id, userId, type, amount, category, categoryName, categoryIcon, description, date, createdAt, updatedAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        transactionId,
        transaction.userId,
        transaction.type,
        transaction.amount,
        transaction.category,
        transaction.categoryName || '',
        transaction.categoryIcon || '',
        transaction.description || '',
        transaction.date.toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        'pending',
      ];

      await this.db.executeSql(query, values);
      await this.addToSyncQueue(
        'create',
        'transactions',
        transactionId,
        transaction,
      );

      console.log(
        `✅ Transaction added for user ${transaction.userId}:`,
        transactionId,
      );
      return transactionId;
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      throw error;
    }
  }

  // Enhanced update transaction with better validation
  async updateTransaction(transactionId, updateData) {
    await this.ensureInitialized();

    if (!updateData.userId || !transactionId) {
      throw new Error('UserId and transactionId are required');
    }

    try {
      // First check if transaction exists and belongs to user
      const existingTransaction = await this.getTransactionById(
        transactionId,
        updateData.userId,
      );
      if (!existingTransaction) {
        throw new Error('Transaction not found or access denied');
      }

      const query = `
      UPDATE transactions 
      SET type = ?, amount = ?, category = ?, categoryName = ?, categoryIcon = ?, 
          description = ?, date = ?, updatedAt = ?, syncStatus = ?
      WHERE id = ? AND userId = ?
    `;

      const values = [
        updateData.type,
        updateData.amount,
        updateData.category,
        updateData.categoryName || '',
        updateData.categoryIcon || '',
        updateData.description || '',
        updateData.date instanceof Date
          ? updateData.date.toISOString()
          : updateData.date,
        new Date().toISOString(),
        'pending',
        transactionId,
        updateData.userId,
      ];

      const [result] = await this.db.executeSql(query, values);

      if (result.rowsAffected === 0) {
        throw new Error('No transaction was updated');
      }

      await this.addToSyncQueue(
        'update',
        'transactions',
        transactionId,
        updateData,
      );

      console.log(
        `✅ Transaction updated for user ${updateData.userId}:`,
        transactionId,
      );
      return true;
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(transactionId, userId) {
    await this.ensureInitialized();

    if (!userId) {
      throw new Error('UserId required for delete operation');
    }

    try {
      const query = `
        UPDATE transactions 
        SET isDeleted = 1, updatedAt = ?, syncStatus = ?
        WHERE id = ? AND userId = ?
      `;

      await this.db.executeSql(query, [
        new Date().toISOString(),
        'pending',
        transactionId,
        userId,
      ]);

      await this.addToSyncQueue('delete', 'transactions', transactionId, {
        userId,
      });

      console.log(`✅ Transaction deleted for user ${userId}:`, transactionId);
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      throw error;
    }
  }
  async canEditTransaction(transactionId, userId) {
    try {
      const transaction = await this.getTransactionById(transactionId, userId);
      return transaction && transaction.isDeleted === 0;
    } catch (error) {
      console.error('❌ Error checking edit permission:', error);
      return false;
    }
  }

  // Sync Queue Operations
  async addToSyncQueue(operation, tableName, recordId, data) {
    await this.ensureInitialized();

    try {
      // Remove any existing pending sync for the same record and operation
      await this.db.executeSql(
        `DELETE FROM sync_queue WHERE recordId = ? AND operation = ? AND status = 'pending'`,
        [recordId, operation],
      );

      const query = `
      INSERT INTO sync_queue (operation, tableName, recordId, data, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;

      await this.db.executeSql(query, [
        operation,
        tableName,
        recordId,
        data ? JSON.stringify(data) : null,
        new Date().toISOString(),
      ]);

      console.log(
        `📝 Added to sync queue: ${operation} ${tableName} ${recordId}`,
      );
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
      throw error;
    }
  }
  async getSyncQueueStatus() {
    await this.ensureInitialized();

    try {
      const query = `
      SELECT 
        status,
        operation,
        COUNT(*) as count 
      FROM sync_queue 
      GROUP BY status, operation
    `;

      const [results] = await this.db.executeSql(query);
      const status = this.processResults(results);

      console.log('📊 Sync queue status:', status);
      return status;
    } catch (error) {
      console.error('❌ Error getting sync queue status:', error);
      return [];
    }
  }

  async getPendingSyncItems() {
    await this.ensureInitialized();

    try {
      const query = `
        SELECT * FROM sync_queue 
        WHERE status = 'pending' AND retryCount < 3
        ORDER BY timestamp ASC
        LIMIT 10
      `;

      const [results] = await this.db.executeSql(query);
      const items = this.processResults(results);

      console.log(`📋 Found ${items.length} pending sync items`);
      return items;
    } catch (error) {
      console.error('❌ Error getting pending sync items:', error);
      throw error;
    }
  }

  async updateSyncItemStatus(syncItemId, status, retryCount = null) {
    await this.ensureInitialized();

    try {
      let query, values;

      if (retryCount !== null) {
        query = `UPDATE sync_queue SET status = ?, retryCount = ? WHERE id = ?`;
        values = [status, retryCount, syncItemId];
      } else {
        query = `UPDATE sync_queue SET status = ? WHERE id = ?`;
        values = [status, syncItemId];
      }

      await this.db.executeSql(query, values);
      console.log(`✅ Updated sync item ${syncItemId} status to ${status}`);
    } catch (error) {
      console.error('❌ Error updating sync item status:', error);
      throw error;
    }
  }

  async updateTransactionSyncStatus(transactionId, syncStatus) {
    await this.ensureInitialized();

    try {
      const query = `UPDATE transactions SET syncStatus = ? WHERE id = ?`;
      await this.db.executeSql(query, [syncStatus, transactionId]);
      console.log(
        `✅ Updated transaction ${transactionId} sync status to ${syncStatus}`,
      );
    } catch (error) {
      console.error('❌ Error updating transaction sync status:', error);
      throw error;
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  processResults(results) {
    const items = [];
    for (let i = 0; i < results.rows.length; i++) {
      items.push(results.rows.item(i));
    }
    return items;
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
      this.currentUserId = null;
      console.log('🔒 Database connection closed');
    }
  }
}

export default new LocalDatabase();
