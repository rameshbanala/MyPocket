/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-hooks/exhaustive-deps */
// src/screens/main/WalletScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Animated,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import hybridFirebaseService from '../../services/hybridFirebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

export default function WalletScreen({ navigation }) {
  const { user } = useAuth();

  // State management
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [searchAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#3B82F6', true);
  }, []);

  // Fetch transactions
  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const allTransactions = await hybridFirebaseService.getTransactions(
        user.uid,
        100,
      );
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);

      // Animate entrance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [user]),
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(true);
  };

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(
        transaction => transaction.type === selectedFilter,
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(transaction => {
        const categoryData = getCategoryData(
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
    }

    setFilteredTransactions(filtered);
  }, [selectedFilter, searchQuery, transactions]);

  // Get category data
  const getCategoryData = (categoryId, type) => {
    const categories =
      type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return (
      categories.find(cat => cat.id === categoryId) || {
        name: 'Unknown',
        icon: '❓',
      }
    );
  };

  // Format currency
  const formatCurrency = amount => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = date => {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (transactionDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (transactionDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return transactionDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year:
          transactionDate.getFullYear() !== today.getFullYear()
            ? 'numeric'
            : undefined,
      });
    }
  };

  // Toggle search bar
  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
    Animated.timing(searchAnim, {
      toValue: showSearchBar ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    if (showSearchBar) {
      setSearchQuery('');
    }
  };

  // Delete transaction
  const deleteTransaction = async transactionId => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await hybridFirebaseService.deleteTransaction(
                transactionId,
                user.uid,
              );
              fetchTransactions();
              setShowTransactionModal(false);
              Alert.alert('Success', 'Transaction deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ],
    );
  };

  // Group transactions by date
  const groupTransactionsByDate = transactions => {
    const grouped = {};
    transactions.forEach(transaction => {
      const dateKey = formatDate(transaction.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    return grouped;
  };

  // Filter Modal Component
  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ height: '40%' }}>
          {/* Modal Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-app-text">
              Filter Transactions
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
            >
              <MaterialIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Filter Options */}
          <View className="p-6">
            {[
              {
                key: 'all',
                label: 'All Transactions',
                icon: '📊',
                color: 'primary',
              },
              {
                key: 'income',
                label: 'Income Only',
                icon: '💰',
                color: 'success',
              },
              {
                key: 'expense',
                label: 'Expenses Only',
                icon: '💸',
                color: 'error',
              },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => {
                  setSelectedFilter(filter.key);
                  setShowFilterModal(false);
                }}
                className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
                  selectedFilter === filter.key
                    ? `border-${filter.color}-500 bg-${filter.color}-50`
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text className="text-2xl mr-4">{filter.icon}</Text>
                <Text
                  className={`flex-1 font-semibold ${
                    selectedFilter === filter.key
                      ? `text-${filter.color}-700`
                      : 'text-app-text'
                  }`}
                >
                  {filter.label}
                </Text>
                {selectedFilter === filter.key && (
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color="#3B82F6"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Transaction Detail Modal
  const TransactionModal = () => (
    <Modal
      visible={showTransactionModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTransactionModal(false)}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
          {selectedTransaction && (
            <>
              {/* Modal Header */}
              <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                <Text className="text-xl font-bold text-app-text">
                  Transaction Details
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTransactionModal(false)}
                  className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
                >
                  <MaterialIcons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Transaction Details */}
              <ScrollView className="p-6">
                <View className="items-center mb-6">
                  <View
                    className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
                      selectedTransaction.type === 'income'
                        ? 'bg-success-100'
                        : 'bg-error-100'
                    }`}
                  >
                    <Text className="text-3xl">
                      {
                        getCategoryData(
                          selectedTransaction.category,
                          selectedTransaction.type,
                        ).icon
                      }
                    </Text>
                  </View>
                  <Text
                    className={`text-3xl font-bold ${
                      selectedTransaction.type === 'income'
                        ? 'text-success-600'
                        : 'text-error-600'
                    }`}
                  >
                    {selectedTransaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(selectedTransaction.amount)}
                  </Text>
                  <Text className="text-app-textSecondary text-lg mt-2">
                    {
                      getCategoryData(
                        selectedTransaction.category,
                        selectedTransaction.type,
                      ).name
                    }
                  </Text>
                </View>

                {/* Details */}
                <View className="space-y-4">
                  <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
                    <MaterialIcons name="event" size={24} color="#6B7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-app-textSecondary text-sm">
                        Date
                      </Text>
                      <Text className="text-app-text font-semibold">
                        {new Date(selectedTransaction.date).toLocaleDateString(
                          'en-IN',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </Text>
                    </View>
                  </View>

                  {selectedTransaction.description && (
                    <View className="flex-row items-start p-4 bg-gray-50 rounded-xl">
                      <MaterialIcons
                        name="description"
                        size={24}
                        color="#6B7280"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-app-textSecondary text-sm">
                          Description
                        </Text>
                        <Text className="text-app-text font-semibold">
                          {selectedTransaction.description}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
                    <MaterialIcons name="sync" size={24} color="#6B7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-app-textSecondary text-sm">
                        Sync Status
                      </Text>
                      <Text
                        className={`font-semibold ${
                          selectedTransaction.syncStatus === 'synced'
                            ? 'text-success-600'
                            : 'text-warning-600'
                        }`}
                      >
                        {selectedTransaction.syncStatus === 'synced'
                          ? 'Synced'
                          : 'Pending Sync'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-4 mt-6">
                  <TouchableOpacity
                    className="flex-1 bg-primary-500 py-4 mr-2 rounded-xl items-center"
                    onPress={() => {
                      setShowTransactionModal(false);
                      navigation.navigate('EditTransaction', {
                        transactionId: selectedTransaction.id,
                      });
                    }}
                  >
                    <Text className="text-white font-semibold">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-error-50 border border-error-200 py-4 rounded-xl items-center"
                    onPress={() => deleteTransaction(selectedTransaction.id)}
                  >
                    <Text className="text-error-600 font-semibold">Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Transaction Item Component
  const TransactionItem = ({ item, showDate = false }) => {
    const categoryData = getCategoryData(item.category, item.type);

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 shadow-soft border border-gray-100"
        onPress={() => {
          setSelectedTransaction(item);
          setShowTransactionModal(true);
        }}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View
            className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
              item.type === 'income' ? 'bg-success-100' : 'bg-error-100'
            }`}
          >
            <Text className="text-xl">{categoryData.icon}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-app-text font-semibold text-base">
              {categoryData.name}
            </Text>
            {item.description && (
              <Text
                className="text-app-textSecondary text-sm mt-1"
                numberOfLines={1}
              >
                {item.description}
              </Text>
            )}
            {showDate && (
              <Text className="text-app-textSecondary text-xs mt-1">
                {formatDate(item.date)} •{' '}
                {new Date(item.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>

          <View className="items-end">
            <Text
              className={`font-bold text-lg ${
                item.type === 'income' ? 'text-success-600' : 'text-error-600'
              }`}
            >
              {item.type === 'income' ? '+' : '-'}
              {formatCurrency(item.amount)}
            </Text>
            {item.syncStatus !== 'synced' && (
              <View className="flex-row items-center mt-1">
                <MaterialIcons name="sync" size={12} color="#F59E0B" />
                <Text className="text-warning-600 text-xs ml-1">Syncing</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-primary-500">
        <View className="px-6 py-8">
          <View className="h-6 bg-primary-400 rounded mb-2 w-32" />
          <View className="h-8 bg-primary-400 rounded w-48" />
        </View>
        <View className="flex-1 bg-app-background rounded-t-3xl p-6">
          <View className="h-32 bg-gray-200 rounded-2xl mb-6 animate-pulse" />
          <View className="h-20 bg-gray-200 rounded-2xl mb-6 animate-pulse" />
          <View className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        </View>
      </View>
    );
  }

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const groupKeys = Object.keys(groupedTransactions);

  return (
    <View className="flex-1 bg-primary-500">
      {/* Header Section */}
      <Animated.View className="px-6 py-8" style={{ opacity: fadeAnim }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-primary-100 text-base font-medium">
              Your Wallet
            </Text>
            <Text className="text-white text-2xl font-bold">
              {filteredTransactions.length} Transactions
            </Text>
          </View>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-primary-600 w-12 h-12 mr-3 rounded-full items-center justify-center"
              onPress={toggleSearchBar}
            >
              <MaterialIcons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center"
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialIcons name="filter-list" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Animated.View
          style={{
            height: searchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            opacity: searchAnim,
          }}
        >
          <View className="bg-white rounded-2xl mb-3 p-2">
            <TextInput
              className="text-app-text text-base border-black-100 "
              style={{ width: '100%', height: 40 }}
              placeholder="Search transactions..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Filter Indicator */}
        {selectedFilter !== 'all' && (
          <View className="bg-primary-600 px-4 py-2 rounded-xl self-start">
            <Text className="text-white font-medium capitalize">
              {selectedFilter} Only
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Transactions List */}
      <Animated.View
        className="flex-1 bg-app-background rounded-t-3xl"
        style={{ opacity: fadeAnim }}
      >
        {filteredTransactions.length > 0 ? (
          <ScrollView
            className="flex-1 p-6"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {groupKeys.map(dateKey => (
              <View key={dateKey} className="mb-6">
                <Text className="text-app-text text-lg font-bold mb-3">
                  {dateKey}
                </Text>
                {groupedTransactions[dateKey].map(transaction => (
                  <TransactionItem
                    key={transaction.id}
                    item={transaction}
                    showDate={dateKey === 'Today' || dateKey === 'Yesterday'}
                  />
                ))}
              </View>
            ))}

            {/* Add Transaction Button */}
            <TouchableOpacity
              className="bg-primary-500 py-4 rounded-2xl items-center mt-4 mb-8"
              onPress={() => navigation.navigate('Add')}
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Add New Transaction
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons
                name="wallet-outline"
                size={40}
                color="#9CA3AF"
              />
            </View>
            <Text className="text-app-text text-xl font-bold mb-2">
              {searchQuery ? 'No results found' : 'No transactions yet'}
            </Text>
            <Text className="text-app-textSecondary text-center mb-8 leading-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start tracking your finances by adding your first transaction'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                className="bg-primary-500 px-8 py-4 rounded-xl"
                onPress={() => navigation.navigate('Add')}
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-semibold text-lg">
                  Add Transaction
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {/* Modals */}
      <FilterModal />
      <TransactionModal />
    </View>
  );
}
