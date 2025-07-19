/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// src/screens/main/HomeScreen.js
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
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getFinancialSummary,
  getTransactions,
} from '../../services/firebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  // State management
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    transactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#3B82F6', true);
  }, []);

  // Fetch data function
  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      // Fetch financial summary and recent transactions
      const [summaryData, transactionsData] = await Promise.all([
        getFinancialSummary(user.uid),
        getTransactions(user.uid, 10), // Get last 10 transactions
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactionsData);

      // Animate content entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error fetching home data:', error);
      Alert.alert(
        'Error',
        'Failed to load data. Please check your connection.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user]),
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

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
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return transactionDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <View className="flex-1 bg-primary-500">
        <View className="px-6 py-8">
          <View className="h-6 bg-primary-400 rounded mb-2 w-32" />
          <View className="h-8 bg-primary-400 rounded w-48" />
        </View>
        <View className="flex-1 bg-white rounded-t-3xl p-6">
          <View className="h-32 bg-gray-200 rounded-2xl mb-6" />
          <View className="h-20 bg-gray-200 rounded-2xl mb-6" />
          <View className="h-40 bg-gray-200 rounded-2xl" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-500">
      {/* Header Section */}
      <Animated.View
        className="px-6 py-8"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-primary-100 text-base font-medium">
              Welcome back,
            </Text>
            <Text className="text-white text-2xl font-bold">
              {user?.email?.split('@')[0]?.charAt(0)?.toUpperCase() +
                user?.email?.split('@')[0]?.slice(1) || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center"
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialIcons name="person" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View
          className="bg-white rounded-3xl p-6 shadow-floating"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View className="items-center mb-4">
            <Text className="text-app-textSecondary text-base mb-2">
              Current Balance
            </Text>
            <Text
              className={`text-4xl font-bold ${
                summary.balance >= 0 ? 'text-success-600' : 'text-error-600'
              }`}
            >
              {formatCurrency(summary.balance)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="trending-up" size={16} color="#10B981" />
                <Text className="text-success-600 text-sm font-medium ml-1">
                  Income
                </Text>
              </View>
              <Text className="text-success-600 text-lg font-bold">
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            <View className="w-px bg-gray-200 mx-4" />

            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="trending-down" size={16} color="#EF4444" />
                <Text className="text-error-600 text-sm font-medium ml-1">
                  Expenses
                </Text>
              </View>
              <Text className="text-error-600 text-lg font-bold">
                {formatCurrency(summary.totalExpenses)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        className="flex-1 bg-white rounded-t-3xl"
        style={{ opacity: fadeAnim }}
      >
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="p-6">
            {/* Quick Actions - Enhanced Design */}
            <View className="mb-8">
              <Text className="text-app-text text-xl font-bold mb-4">
                Quick Actions
              </Text>
              <View className="flex-row justify-between">
                <TouchableOpacity
                  className="flex-1 bg-gradient-to-r from-success-500 to-success-600 p-6 rounded-2xl mr-3"
                  onPress={() => navigation.navigate('Add', { type: 'income' })}
                  style={{
                    backgroundColor: '#10B981',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <View className="items-center">
                    <View className="bg-white bg-opacity-20 w-14 h-14 rounded-full items-center justify-center mb-3">
                      <MaterialIcons
                        name="arrow-upward"
                        size={28}
                        color="#000000"
                      />
                    </View>
                    <Text className="text-white font-bold text-base">
                      Add Income
                    </Text>
                    <Text className="text-success-100 text-sm mt-1">
                      Track earnings
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-gradient-to-r from-error-500 to-error-600 p-6 rounded-2xl ml-3"
                  onPress={() =>
                    navigation.navigate('Add', { type: 'expense' })
                  }
                  style={{
                    backgroundColor: '#EF4444',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <View className="items-center">
                    <View className="bg-white bg-opacity-20 w-14 h-14 rounded-full items-center justify-center mb-3">
                      <MaterialIcons
                        name="arrow-downward"
                        size={28}
                        color="#000000"
                      />
                    </View>
                    <Text className="text-white font-bold text-base">
                      Add Expense
                    </Text>
                    <Text className="text-error-100 text-sm mt-1">
                      Track spending
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* This Month Summary */}
            <View className="mb-8">
              <Text className="text-app-text text-xl font-bold mb-4">
                This Month
              </Text>
              <View
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 items-center">
                    <Text className="text-app-textSecondary text-sm font-medium">
                      Monthly Income
                    </Text>
                    <Text className="text-success-600 text-xl font-bold mt-1">
                      {formatCurrency(summary.thisMonthIncome)}
                    </Text>
                  </View>

                  <View
                    className="w-px bg-gray-300 mx-6"
                    style={{ height: 40 }}
                  />

                  <View className="flex-1 items-center">
                    <Text className="text-app-textSecondary text-sm font-medium">
                      Monthly Expenses
                    </Text>
                    <Text className="text-error-600 text-xl font-bold mt-1">
                      {formatCurrency(summary.thisMonthExpenses)}
                    </Text>
                  </View>

                  <View
                    className="w-px bg-gray-300 mx-6"
                    style={{ height: 40 }}
                  />

                  <View className="flex-1 items-center">
                    <Text className="text-app-textSecondary text-sm font-medium">
                      Net Savings
                    </Text>
                    <Text
                      className={`text-xl font-bold mt-1 ${
                        summary.thisMonthIncome - summary.thisMonthExpenses >= 0
                          ? 'text-success-600'
                          : 'text-error-600'
                      }`}
                    >
                      {formatCurrency(
                        summary.thisMonthIncome - summary.thisMonthExpenses,
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Recent Transactions */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-app-text text-xl font-bold">
                  Recent Transactions
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Wallet')}
                  className="flex-row items-center bg-primary-50 px-3 py-2 rounded-full"
                >
                  <Text className="text-primary-600 font-semibold mr-1 text-sm">
                    View All
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={16}
                    color="#3B82F6"
                  />
                </TouchableOpacity>
              </View>

              {recentTransactions.length > 0 ? (
                <View
                  className="bg-white rounded-2xl border border-gray-100"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  {recentTransactions.map((transaction, index) => {
                    const categoryData = getCategoryData(
                      transaction.category,
                      transaction.type,
                    );

                    return (
                      <View key={transaction.id}>
                        <TouchableOpacity
                          className="flex-row items-center p-4"
                          activeOpacity={0.7}
                        >
                          <View
                            className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
                              transaction.type === 'income'
                                ? 'bg-success-100'
                                : 'bg-error-100'
                            }`}
                          >
                            <Text className="text-2xl">
                              {categoryData.icon}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <Text className="text-app-text font-semibold text-base">
                              {categoryData.name}
                            </Text>
                            {transaction.description && (
                              <Text
                                className="text-app-textSecondary text-sm mt-1"
                                numberOfLines={1}
                              >
                                {transaction.description}
                              </Text>
                            )}
                            <Text className="text-app-textSecondary text-xs mt-1">
                              {formatDate(transaction.date)}
                            </Text>
                          </View>

                          <View className="items-end">
                            <Text
                              className={`font-bold text-lg ${
                                transaction.type === 'income'
                                  ? 'text-success-600'
                                  : 'text-error-600'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {index < recentTransactions.length - 1 && (
                          <View className="border-b border-gray-100 ml-18" />
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View
                  className="bg-white rounded-2xl p-8 border border-gray-100 items-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <View className="bg-gray-100 w-16 h-16 rounded-full items-center justify-center mb-4">
                    <MaterialCommunityIcons
                      name="receipt-outline"
                      size={32}
                      color="#9CA3AF"
                    />
                  </View>
                  <Text className="text-app-text text-lg font-semibold mb-2">
                    No transactions yet
                  </Text>
                  <Text className="text-app-textSecondary text-center mb-6 leading-5">
                    Start tracking your expenses by adding your first
                    transaction
                  </Text>
                  <TouchableOpacity
                    className="bg-primary-500 px-8 py-3 rounded-xl"
                    onPress={() => navigation.navigate('Add')}
                    style={{
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Text className="text-white font-semibold">
                      Add Transaction
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick Stats Cards - Enhanced with proper spacing */}
            {summary.transactionCount > 0 && (
              <View className="mb-6">
                <Text className="text-app-text text-xl font-bold mb-4">
                  Quick Stats
                </Text>
                <View className="flex-row justify-between">
                  <View
                    className="flex-1 bg-primary-50 p-5 rounded-2xl border border-primary-100 mr-3"
                    style={{
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <MaterialCommunityIcons
                        name="format-list-numbered"
                        size={24}
                        color="#3B82F6"
                      />
                      <View className="bg-primary-500 w-6 h-6 rounded-full items-center justify-center">
                        <MaterialIcons
                          name="trending-up"
                          size={14}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>
                    <Text className="text-primary-700 text-2xl font-bold mb-1">
                      {summary.transactionCount}
                    </Text>
                    <Text className="text-primary-600 text-sm font-medium">
                      Total Transactions
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="flex-1 bg-warning-50 p-5 rounded-2xl border border-warning-100 ml-3"
                    onPress={() => navigation.navigate('Analytics')}
                    style={{
                      shadowColor: '#F59E0B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <MaterialCommunityIcons
                        name="chart-pie"
                        size={24}
                        color="#F59E0B"
                      />
                      <View className="bg-warning-500 w-6 h-6 rounded-full items-center justify-center">
                        <MaterialIcons
                          name="visibility"
                          size={14}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>
                    <Text className="text-warning-700 text-2xl font-bold mb-1">
                      {Object.keys(summary.expensesByCategory || {}).length}
                    </Text>
                    <Text className="text-warning-600 text-sm font-medium">
                      Categories Used
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom Spacing for Tab Bar */}
            <View className="h-6" />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
