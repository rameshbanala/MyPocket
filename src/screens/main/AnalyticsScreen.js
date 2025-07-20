/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
// src/screens/main/AnalyticsScreen.js (Fixed Version)
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
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import hybridFirebaseService from '../../services/hybridFirebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const { user } = useAuth();
  
  // State management
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    transactionCount: 0,
    expensesByCategory: {},
    incomeByCategory: {},
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  
  // Chart data
  const [expenseChartData, setExpenseChartData] = useState([]);
  const [incomeChartData, setIncomeChartData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categoryInsights, setCategoryInsights] = useState([]);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#3B82F6', true);
  }, []);

  // Fetch analytics data
  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Get financial summary and transactions
      const [summaryData, allTransactions] = await Promise.all([
        hybridFirebaseService.getFinancialSummary(user.uid),
        hybridFirebaseService.getTransactions(user.uid, 500)
      ]);
      
      setSummary(summaryData);
      setTransactions(allTransactions);
      
      // Process analytics data
      processAnalyticsData(allTransactions, summaryData);
      
      // Animate entrance
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
      console.error('Error fetching analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Process data for charts and insights
  const processAnalyticsData = (allTransactions, summaryData) => {
    const filteredTransactions = filterTransactionsByPeriod(allTransactions, selectedPeriod);
    
    // Process expense data
    const expenseData = {};
    const incomeData = {};
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const categoryData = getCategoryData(transaction.category, 'expense');
        const categoryName = categoryData.name;
        expenseData[categoryName] = (expenseData[categoryName] || 0) + transaction.amount;
      } else {
        const categoryData = getCategoryData(transaction.category, 'income');
        const categoryName = categoryData.name;
        incomeData[categoryName] = (incomeData[categoryName] || 0) + transaction.amount;
      }
    });

    // Convert to chart format
    const expenseChartArray = Object.entries(expenseData)
      .map(([category, amount]) => ({
        category: category.length > 20 ? category.substring(0, 20) + '...' : category,
        amount: amount,
        fullName: category,
        percentage: (amount / summaryData.totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories

    const incomeChartArray = Object.entries(incomeData)
      .map(([category, amount]) => ({
        category: category.length > 20 ? category.substring(0, 20) + '...' : category,
        amount: amount,
        fullName: category,
        percentage: (amount / summaryData.totalIncome) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories

    setExpenseChartData(expenseChartArray);
    setIncomeChartData(incomeChartArray);
    
    // Process trend data (last 6 months)
    const trendArray = generateTrendData(allTransactions);
    setTrendData(trendArray);
    
    // Generate insights
    const insights = generateCategoryInsights(filteredTransactions, summaryData);
    setCategoryInsights(insights);
  };

  // Filter transactions by selected period
  const filterTransactionsByPeriod = (transactions, period) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'thisWeek':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last6Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions.filter(transaction => 
      new Date(transaction.date) >= startDate
    );
  };

  // Generate trend data for line chart
  const generateTrendData = (transactions) => {
    const now = new Date();
    const months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        date: date,
        income: 0,
        expenses: 0
      });
    }

    // Aggregate data by month
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthIndex = months.findIndex(month => 
        month.date.getMonth() === transactionDate.getMonth() &&
        month.date.getFullYear() === transactionDate.getFullYear()
      );

      if (monthIndex !== -1) {
        if (transaction.type === 'income') {
          months[monthIndex].income += transaction.amount;
        } else {
          months[monthIndex].expenses += transaction.amount;
        }
      }
    });

    return months;
  };

  // Generate category insights
  const generateCategoryInsights = (transactions, summaryData) => {
    const insights = [];
    
    // Top spending category
    if (Object.keys(summaryData.expensesByCategory).length > 0) {
      const topCategory = Object.entries(summaryData.expensesByCategory)
        .sort(([,a], [,b]) => b - a)[0];
      
      const categoryData = getCategoryData(topCategory[0], 'expense');
      insights.push({
        id: 'topSpending',
        title: 'Top Spending Category',
        description: `You spent the most on ${categoryData.name}`,
        amount: topCategory[1],
        icon: categoryData.icon,
        type: 'expense'
      });
    }

    // Savings rate
    if (summaryData.totalIncome > 0) {
      const savingsRate = ((summaryData.totalIncome - summaryData.totalExpenses) / summaryData.totalIncome * 100);
      insights.push({
        id: 'savingsRate',
        title: 'Savings Rate',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income`,
        percentage: savingsRate,
        icon: '💰',
        type: savingsRate > 20 ? 'positive' : savingsRate > 10 ? 'neutral' : 'negative'
      });
    }

    // Transaction frequency
    const avgTransactionsPerDay = transactions.length / 30;
    insights.push({
      id: 'frequency',
      title: 'Transaction Frequency',
      description: `${avgTransactionsPerDay.toFixed(1)} transactions per day on average`,
      count: transactions.length,
      icon: '📊',
      type: 'neutral'
    });

    return insights;
  };

  // Get category data
  const getCategoryData = (categoryId, type) => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return categories.find(cat => cat.id === categoryId) || {
      name: 'Unknown',
      icon: '❓'
    };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAnalyticsData();
    }, [user, selectedPeriod])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData(true);
  };

  // Custom Chart Components (Text-based)
  const CategoryChart = ({ data, title, type }) => {
    const colors = type === 'expense' 
      ? ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6']
      : ['#22C55E', '#10B981', '#059669', '#047857', '#065F46', '#064E3B'];

    return (
      <View className="bg-white rounded-2xl p-4 mb-6 shadow-card border border-gray-100">
        <Text className="text-app-text text-lg font-bold mb-4">{title}</Text>
        {data.length > 0 ? (
          <View>
            {data.map((item, index) => (
              <View key={item.category} className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-app-text font-medium flex-1" numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Text className="text-app-text font-bold ml-2">
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <View 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: colors[index % colors.length]
                      }}
                    />
                  </View>
                  <Text className="text-app-textSecondary text-sm">
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center py-8">
            <Text className="text-app-textSecondary">No data available</Text>
          </View>
        )}
      </View>
    );
  };

  // Trend Chart Component
  const TrendChart = () => (
    <View className="bg-white rounded-2xl p-4 mb-6 shadow-card border border-gray-100">
      <Text className="text-app-text text-lg font-bold mb-4">6-Month Trend</Text>
      {trendData.length > 0 ? (
        <View>
          <View className="flex-row justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-success-500 rounded mr-2" />
              <Text className="text-sm text-app-textSecondary">Income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-error-500 rounded mr-2" />
              <Text className="text-sm text-app-textSecondary">Expenses</Text>
            </View>
          </View>
          {trendData.map((month, index) => {
            const maxAmount = Math.max(...trendData.map(m => Math.max(m.income, m.expenses)));
            const incomeWidth = maxAmount > 0 ? (month.income / maxAmount) * 100 : 0;
            const expenseWidth = maxAmount > 0 ? (month.expenses / maxAmount) * 100 : 0;
            
            return (
              <View key={month.month} className="mb-4">
                <Text className="text-app-text font-medium mb-2">{month.month}</Text>
                <View className="space-y-2">
                  <View className="flex-row items-center">
                    <View className="w-16">
                      <Text className="text-xs text-app-textSecondary">Income</Text>
                    </View>
                    <View className="flex-1 bg-gray-200 rounded-full h-3 mx-2">
                      <View 
                        className="h-3 bg-success-500 rounded-full"
                        style={{ width: `${incomeWidth}%` }}
                      />
                    </View>
                    <Text className="text-xs text-app-textSecondary w-16 text-right">
                      {formatCurrency(month.income)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-16">
                      <Text className="text-xs text-app-textSecondary">Expenses</Text>
                    </View>
                    <View className="flex-1 bg-gray-200 rounded-full h-3 mx-2">
                      <View 
                        className="h-3 bg-error-500 rounded-full"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </View>
                    <Text className="text-xs text-app-textSecondary w-16 text-right">
                      {formatCurrency(month.expenses)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="items-center py-8">
          <Text className="text-app-textSecondary">No trend data available</Text>
        </View>
      )}
    </View>
  );

  // Period selector modal
  const PeriodModal = () => (
    <Modal
      visible={showPeriodModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPeriodModal(false)}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ height: '50%' }}>
          <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-app-text">Select Time Period</Text>
            <TouchableOpacity
              onPress={() => setShowPeriodModal(false)}
              className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
            >
              <MaterialIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6">
            {[
              { key: 'thisWeek', label: 'This Week', icon: '📅' },
              { key: 'thisMonth', label: 'This Month', icon: '📆' },
              { key: 'last3Months', label: 'Last 3 Months', icon: '🗓️' },
              { key: 'last6Months', label: 'Last 6 Months', icon: '📊' },
              { key: 'thisYear', label: 'This Year', icon: '🗃️' },
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                onPress={() => {
                  setSelectedPeriod(period.key);
                  setShowPeriodModal(false);
                }}
                className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
                  selectedPeriod === period.key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text className="text-2xl mr-4">{period.icon}</Text>
                <Text
                  className={`flex-1 font-semibold ${
                    selectedPeriod === period.key
                      ? 'text-primary-700'
                      : 'text-app-text'
                  }`}
                >
                  {period.label}
                </Text>
                {selectedPeriod === period.key && (
                  <MaterialIcons name="check-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Insights component
  const InsightsSection = () => (
    <View className="mb-6">
      <Text className="text-app-text text-xl font-bold mb-4 px-6">Financial Insights</Text>
      {categoryInsights.map((insight) => (
        <View key={insight.id} className="bg-white rounded-2xl p-4 mx-6 mb-4 shadow-card border border-gray-100">
          <View className="flex-row items-center">
            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
              insight.type === 'positive' ? 'bg-success-100' :
              insight.type === 'negative' ? 'bg-error-100' : 'bg-primary-100'
            }`}>
              <Text className="text-2xl">{insight.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-app-text font-semibold text-base">{insight.title}</Text>
              <Text className="text-app-textSecondary text-sm mt-1">{insight.description}</Text>
              {insight.amount && (
                <Text className={`font-bold text-lg mt-1 ${
                  insight.type === 'expense' ? 'text-error-600' : 'text-success-600'
                }`}>
                  {formatCurrency(insight.amount)}
                </Text>
              )}
              {insight.percentage !== undefined && (
                <Text className={`font-bold text-lg mt-1 ${
                  insight.type === 'positive' ? 'text-success-600' :
                  insight.type === 'negative' ? 'text-error-600' : 'text-warning-600'
                }`}>
                  {insight.percentage.toFixed(1)}%
                </Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );

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

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'thisWeek': return 'This Week';
      case 'thisMonth': return 'This Month';
      case 'last3Months': return 'Last 3 Months';
      case 'last6Months': return 'Last 6 Months';
      case 'thisYear': return 'This Year';
      default: return 'This Month';
    }
  };

  return (
    <View className="flex-1 bg-primary-500">
      {/* Header Section */}
      <Animated.View 
        className="px-6 py-8"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-primary-100 text-base font-medium">Analytics</Text>
            <Text className="text-white text-2xl font-bold">Financial Insights</Text>
          </View>
          
          <TouchableOpacity
            className="bg-primary-600 px-4 py-2 rounded-full"
            onPress={() => setShowPeriodModal(true)}
          >
            <View className="flex-row items-center">
              <Text className="text-white font-medium mr-2">{getPeriodLabel()}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View className="flex-row justify-between mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-card">
            <Text className="text-app-textSecondary text-sm font-medium">Total Income</Text>
            <Text className="text-success-600 text-xl font-bold mt-1">
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>
          
          <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-card">
            <Text className="text-app-textSecondary text-sm font-medium">Total Expenses</Text>
            <Text className="text-error-600 text-xl font-bold mt-1">
              {formatCurrency(summary.totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Balance Card */}
        <View className="bg-white rounded-2xl p-4 shadow-card">
          <Text className="text-app-textSecondary text-sm font-medium">Net Balance</Text>
          <Text className={`text-2xl font-bold mt-1 ${
            summary.balance >= 0 ? 'text-success-600' : 'text-error-600'
          }`}>
            {formatCurrency(summary.balance)}
          </Text>
        </View>
      </Animated.View>

      {/* Charts and Analytics */}
      <Animated.View 
        className="flex-1 bg-app-background rounded-t-3xl"
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
            {/* Charts */}
            <CategoryChart 
              data={expenseChartData} 
              title="Expenses by Category" 
              type="expense" 
            />
            
            <CategoryChart 
              data={incomeChartData} 
              title="Income Sources" 
              type="income" 
            />
            
            <TrendChart />

            {/* Insights */}
            <InsightsSection />

            {/* Bottom spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Period Selection Modal */}
      <PeriodModal />
    </View>
  );
}
