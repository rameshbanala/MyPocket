// src/screens/main/HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-app-textSecondary text-base">Welcome back,</Text>
        <Text className="text-app-text text-2xl font-bold">
          {user?.email?.split('@')[0] || 'User'}
        </Text>
      </View>

      {/* Balance Card */}
      <View className="mx-6 mb-6">
        <View className="bg-primary-500 rounded-2xl p-6 shadow-floating">
          <Text className="text-primary-100 text-base mb-2">Total Balance</Text>
          <Text className="text-white text-4xl font-bold mb-4">₹25,450</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-primary-200 text-sm">Income</Text>
              <Text className="text-white text-lg font-semibold">₹45,000</Text>
            </View>
            <View>
              <Text className="text-primary-200 text-sm">Expenses</Text>
              <Text className="text-white text-lg font-semibold">₹19,550</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mb-6">
        <Text className="text-app-text text-lg font-semibold mb-4">
          Quick Actions
        </Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity className="flex-1 bg-success-50 p-4 rounded-xl border border-success-200">
            <Text className="text-success-600 text-2xl mb-2">💰</Text>
            <Text className="text-success-700 font-semibold">Add Income</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-error-50 p-4 rounded-xl border border-error-200">
            <Text className="text-error-600 text-2xl mb-2">💸</Text>
            <Text className="text-error-700 font-semibold">Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="px-6">
        <Text className="text-app-text text-lg font-semibold mb-4">
          Recent Transactions
        </Text>
        <View className="bg-white rounded-2xl p-4 shadow-card">
          <Text className="text-app-textSecondary text-center py-8">
            No transactions yet
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
