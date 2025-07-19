/* eslint-disable react/no-unstable-nested-components */
// src/screens/main/AddTransactionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import { addTransaction } from '../../services/firebaseService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';

export default function AddTransactionScreen({ navigation }) {
  const { user } = useAuth();

  // Form state
  const [transactionType, setTransactionType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // UI state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#3B82F6', true);
  }, []);

  const categories =
    transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeSwitch = type => {
    setTransactionType(type);
    setSelectedCategory(null);
    Animated.timing(slideAnim, {
      toValue: type === 'expense' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCategorySelect = category => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert(
        'Missing Information',
        'Please fill in amount and select a category',
      );
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0',
      );
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        type: transactionType,
        amount: parseFloat(amount),
        category: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        description: description.trim(),
        date: selectedDate,
        userId: user.uid,
      };

      const transactionId = await addTransaction(user.uid, transactionData);

      console.log('Transaction added successfully with ID:', transactionId);

      Alert.alert(
        '✅ Success!',
        `${transactionType === 'expense' ? 'Expense' : 'Income'} of ₹${amount} added successfully`,
        [
          {
            text: 'Add Another',
            onPress: resetForm,
          },
          {
            text: 'Go to Home',
            onPress: () => navigation.navigate('Home'),
            style: 'default',
          },
        ],
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert(
        'Error',
        'Failed to add transaction. Please check your internet connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedCategory(null);
    setDescription('');
    setSelectedDate(new Date());
  };

  const formatDate = date => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const CategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ height: '75%' }}>
          {/* Modal Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-app-text">
              Select {transactionType === 'expense' ? 'Expense' : 'Income'}{' '}
              Category
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
            >
              <MaterialIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Categories Grid */}
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row flex-wrap justify-between pt-4">
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleCategorySelect(category)}
                  className={`w-[48%] mb-4 p-4 rounded-2xl border-2 ${
                    selectedCategory?.id === category.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  style={{
                    shadowColor:
                      selectedCategory?.id === category.id ? '#3B82F6' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity:
                      selectedCategory?.id === category.id ? 0.15 : 0.05,
                    shadowRadius: 4,
                    elevation: selectedCategory?.id === category.id ? 3 : 1,
                  }}
                >
                  <Text className="text-3xl mb-2">{category.icon}</Text>
                  <Text
                    className={`font-semibold text-sm leading-5 ${
                      selectedCategory?.id === category.id
                        ? 'text-primary-700'
                        : 'text-gray-700'
                    }`}
                    numberOfLines={2}
                  >
                    {category.name}
                  </Text>
                  {selectedCategory?.id === category.id && (
                    <View className="absolute top-2 right-2">
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#3B82F6"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-primary-500">
      {/* Header */}
      <View className="px-6 py-6">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center"
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold">Add Transaction</Text>

          <TouchableOpacity
            onPress={resetForm}
            className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center"
          >
            <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Type Switcher */}
        <View className="bg-primary-600 rounded-2xl p-1 mt-6">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => handleTypeSwitch('expense')}
              className={`flex-1 py-3 rounded-xl items-center ${
                transactionType === 'expense' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`font-semibold ${
                  transactionType === 'expense'
                    ? 'text-primary-500'
                    : 'text-white'
                }`}
              >
                💸 Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeSwitch('income')}
              className={`flex-1 py-3 rounded-xl items-center ${
                transactionType === 'income' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`font-semibold ${
                  transactionType === 'income'
                    ? 'text-primary-500'
                    : 'text-white'
                }`}
              >
                💰 Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Form Container */}
      <View className="flex-1 bg-white rounded-t-3xl">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Amount Input */}
            <View className="mb-6">
              <Text className="text-app-text font-semibold text-lg mb-3">
                Amount *
              </Text>
              <View className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
                <View className="flex-row items-center">
                  <Text className="text-app-text text-2xl font-bold mr-2">
                    ₹
                  </Text>
                  <TextInput
                    className="flex-1 text-app-text text-2xl font-bold"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>
              {amount && parseFloat(amount) > 0 && (
                <Text className="text-app-textSecondary text-sm mt-2">
                  {parseFloat(amount).toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                  })}
                </Text>
              )}
            </View>

            {/* Category Selection */}
            <View className="mb-6">
              <Text className="text-app-text font-semibold text-lg mb-3">
                Category *
              </Text>
              <TouchableOpacity
                className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100 flex-row items-center justify-between"
                onPress={() => setShowCategoryModal(true)}
              >
                {selectedCategory ? (
                  <View className="flex-row items-center flex-1">
                    <View className="bg-primary-50 w-12 h-12 rounded-xl items-center justify-center mr-3">
                      <Text className="text-2xl">{selectedCategory.icon}</Text>
                    </View>
                    <Text className="text-app-text font-semibold text-base">
                      {selectedCategory.name}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-app-textSecondary text-base">
                    Select a category
                  </Text>
                )}
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Date Selection */}
            <View className="mb-6">
              <Text className="text-app-text font-semibold text-lg mb-3">
                Date
              </Text>
              <TouchableOpacity
                className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100 flex-row items-center justify-between"
                onPress={() => setShowDatePicker(true)}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="event" size={24} color="#3B82F6" />
                  <Text className="text-app-text font-semibold text-base ml-3">
                    {formatDate(selectedDate)}
                  </Text>
                  {selectedDate.toDateString() !==
                    new Date().toDateString() && (
                    <Text className="text-app-textSecondary text-sm ml-2">
                      ({selectedDate.toLocaleDateString('en-IN')})
                    </Text>
                  )}
                </View>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Description Input */}
            <View className="mb-8">
              <Text className="text-app-text font-semibold text-lg mb-3">
                Description
              </Text>
              <TextInput
                className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100 text-app-text"
                placeholder="Add a note (optional)"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text className="text-app-textSecondary text-xs mt-2 text-right">
                {description.length}/200
              </Text>
            </View>

            {/* Quick Amount Buttons */}
            <View className="mb-8">
              <Text className="text-app-text font-semibold text-lg mb-3">
                Quick Amount
              </Text>
              <View className="flex-row flex-wrap">
                {['100', '500', '1000', '2000', '5000', '10000'].map(
                  quickAmount => (
                    <TouchableOpacity
                      key={quickAmount}
                      className={`border rounded-xl px-4 py-2 mr-3 mb-3 ${
                        amount === quickAmount
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-primary-50 border-primary-200'
                      }`}
                      onPress={() => setAmount(quickAmount)}
                    >
                      <Text
                        className={`font-medium ${
                          amount === quickAmount
                            ? 'text-white'
                            : 'text-primary-600'
                        }`}
                      >
                        ₹{quickAmount}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="p-6 bg-white border-t border-gray-100">
          <TouchableOpacity
            className={`${
              transactionType === 'expense' ? 'bg-error-500' : 'bg-success-500'
            } rounded-2xl py-4 items-center shadow-soft ${
              loading || !amount || !selectedCategory
                ? 'opacity-50'
                : 'opacity-100'
            }`}
            onPress={handleSubmit}
            disabled={loading || !amount || !selectedCategory}
            style={{
              shadowColor:
                transactionType === 'expense' ? '#EF4444' : '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: !amount || !selectedCategory ? 0 : 0.3,
              shadowRadius: 8,
              elevation: !amount || !selectedCategory ? 0 : 6,
            }}
          >
            <Text className="text-white text-lg font-semibold">
              {loading
                ? 'Adding Transaction...'
                : `Add ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Modal */}
      <CategoryModal />

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        maximumDate={new Date()}
        onConfirm={date => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => {
          setShowDatePicker(false);
        }}
        title="Select Transaction Date"
        confirmText="Select"
        cancelText="Cancel"
      />
    </View>
  );
}
