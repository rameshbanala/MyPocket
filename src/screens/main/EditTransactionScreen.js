/* eslint-disable react-hooks/exhaustive-deps */
// src/screens/main/EditTransactionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import hybridFirebaseService from '../../services/hybridFirebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';

export default function EditTransactionScreen({ route, navigation }) {
  const { user } = useAuth();
  const { transactionId } = route.params;

  // Form state
  const [originalTransaction, setOriginalTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#3B82F6', true);
  }, []);

  // Load transaction data
  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  // Check for changes
  useEffect(() => {
    if (originalTransaction) {
      const hasChanged =
        transactionType !== originalTransaction.type ||
        parseFloat(amount || 0) !== originalTransaction.amount ||
        selectedCategory?.id !== originalTransaction.category ||
        description !== (originalTransaction.description || '') ||
        selectedDate.getTime() !== new Date(originalTransaction.date).getTime();
      setHasChanges(hasChanged);
    }
  }, [
    transactionType,
    amount,
    selectedCategory,
    description,
    selectedDate,
    originalTransaction,
  ]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const transaction = await hybridFirebaseService.getTransactionById(
        transactionId,
        user.uid,
      );

      if (!transaction) {
        Alert.alert('Error', 'Transaction not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // Set form data
      setOriginalTransaction(transaction);
      setTransactionType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setSelectedDate(new Date(transaction.date));

      // Find and set category
      const categories =
        transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const category = categories.find(cat => cat.id === transaction.category);
      setSelectedCategory(category);
    } catch (error) {
      console.error('Error loading transaction:', error);
      Alert.alert('Error', 'Failed to load transaction data', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSwitch = type => {
    if (type !== transactionType) {
      setTransactionType(type);
      setSelectedCategory(null); // Reset category when switching type
    }
  };

  const handleSave = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0',
      );
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category');
      return;
    }

    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to save');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        type: transactionType,
        amount: parseFloat(amount),
        category: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        description: description.trim(),
        date: selectedDate,
      };

      // Validate data
      const validation =
        hybridFirebaseService.validateTransactionData(updateData);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      await hybridFirebaseService.updateTransaction(
        transactionId,
        user.uid,
        updateData,
      );

      Alert.alert('✅ Success!', 'Transaction updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const categories =
    transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const CategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ height: '75%' }}>
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

          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row flex-wrap justify-between pt-4">
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                  className={`w-[48%] mb-4 p-4 rounded-2xl border-2 ${
                    selectedCategory?.id === category.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
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

  if (loading) {
    return (
      <View className="flex-1 bg-primary-500">
        <View className="px-6 py-8">
          <Text className="text-white text-xl font-bold">Loading...</Text>
        </View>
        <View className="flex-1 bg-white rounded-t-3xl items-center justify-center">
          <Text className="text-app-textSecondary">
            Loading transaction data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-500">
      {/* Header */}
      <View className="px-6 py-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleDiscard}
            className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center"
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold">Edit Transaction</Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 rounded-xl ${
              hasChanges && !saving ? 'bg-white' : 'bg-primary-600'
            }`}
          >
            <Text
              className={`font-semibold ${
                hasChanges && !saving
                  ? 'text-primary-500'
                  : 'text-white opacity-50'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </Text>
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
                    {selectedDate.toLocaleDateString('en-IN')}
                  </Text>
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

            {/* Changes Indicator */}
            {hasChanges && (
              <View className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-center">
                  <MaterialIcons name="edit" size={20} color="#F59E0B" />
                  <Text className="text-warning-700 font-medium ml-2">
                    You have unsaved changes
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="p-6 bg-white border-t border-gray-100">
          <View className="flex-row space-x-4">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
              onPress={handleDiscard}
            >
              <Text className="text-app-text font-semibold text-lg">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 rounded-2xl items-center ${
                hasChanges && !saving
                  ? transactionType === 'expense'
                    ? 'bg-error-500'
                    : 'bg-success-500'
                  : 'bg-gray-300'
              }`}
              onPress={handleSave}
              disabled={!hasChanges || saving}
            >
              <Text className="text-white font-semibold text-lg">
                {saving ? 'Updating...' : 'Update Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modals */}
      <CategoryModal />

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
        onCancel={() => setShowDatePicker(false)}
        title="Select Transaction Date"
      />
    </View>
  );
}
