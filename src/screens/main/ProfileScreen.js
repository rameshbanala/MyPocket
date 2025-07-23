/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
// src/screens/main/ProfileScreen.js (Complete version with name editing)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import hybridFirebaseService from '../../services/hybridFirebaseService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const { user, userProfile, signOut, updateUserProfile, isLoggingOut } = useAuth();

  // UI state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Financial Data State
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    thisMonthExpenses: 0,
    transactionCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#3B82F6', true);
  }, []);

  // Fetch financial data
  useEffect(() => {
    if (user && user.uid && !isLoggingOut) {
      fetchFinancialData();
    } else {
      setLoadingStats(false);
    }
  }, [user, isLoggingOut]);

  // Initialize name field when userProfile changes
  useEffect(() => {
    if (userProfile?.name) {
      setNewName(userProfile.name);
    }
  }, [userProfile]);

  const fetchFinancialData = async () => {
    if (!user || !user.uid || isLoggingOut) {
      console.log('⏭️ Skipping financial data fetch - no user or logging out');
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      const summary = await hybridFirebaseService.getFinancialSummary(user.uid);
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      if (user && user.uid) {
        // Only show error if user still exists
        console.log('Failed to load financial data');
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid name');
      return;
    }

    if (newName.trim() === userProfile?.name) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      await updateUserProfile({ name: newName.trim() });
      setEditingName(false);
      Alert.alert('✅ Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('❌ Error', 'Failed to update profile. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getDisplayName = () => {
    return userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name && name !== 'User') {
      return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0)?.toUpperCase() || '👤';
  };

  // Show loading or logout state
  if (isLoggingOut) {
    return (
      <View className="flex-1 bg-primary-500">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text className="text-white text-lg mt-4">Logging out...</Text>
        </View>
      </View>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <View className="flex-1 bg-primary-500">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">No user session found</Text>
        </View>
      </View>
    );
  }

  const ProfileHeader = () => (
    <View className="bg-primary-500 px-6 py-8 rounded-b-3xl">
      <View className="items-center">
        {/* Profile Avatar */}
        <View className="bg-white w-24 h-24 rounded-full items-center justify-center shadow-lg mb-4">
          <Text className="text-primary-500 text-2xl font-bold">
            {getInitials()}
          </Text>
        </View>

        {/* Name or Input */}
        {editingName ? (
          <View className="flex-row items-center mb-2 w-full max-w-xs">
            <TextInput
              value={newName}
              onChangeText={setNewName}
              className="bg-white flex-1 rounded-xl px-4 py-2 text-center text-xl font-bold text-app-text"
              placeholder="Your name"
              maxLength={50}
              autoFocus
            />
            {savingName ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                className="ml-3"
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleNameUpdate}
                  className="ml-3 bg-success-500 p-2 rounded-full"
                >
                  <MaterialIcons name="check" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingName(false);
                    setNewName(userProfile?.name || '');
                  }}
                  className="ml-2 bg-error-500 p-2 rounded-full"
                >
                  <MaterialIcons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setEditingName(true)}
            className="flex-row items-center mb-2"
          >
            <Text className="text-white text-2xl font-bold mr-2">
              {getDisplayName()}
            </Text>
            <MaterialIcons name="edit" size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Email */}
        <Text className="text-primary-100 text-base mb-4">
          {user?.email || 'user@example.com'}
        </Text>

        {/* Member Since */}
        <View className="bg-primary-600 px-4 py-2 rounded-full">
          <Text className="text-white text-sm font-medium">
            Member since {new Date(user?.metadata?.creationTime || Date.now()).getFullYear()}
          </Text>
        </View>
      </View>
    </View>
  );

  const StatsCard = () => (
    <View className="mx-6 -mt-8 bg-white rounded-2xl p-6 shadow-card border border-gray-100">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-app-text text-lg font-semibold">Quick Stats</Text>
        <TouchableOpacity onPress={fetchFinancialData}>
          <MaterialIcons name="refresh" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      
      {loadingStats ? (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-app-textSecondary text-sm mt-2">Loading stats...</Text>
        </View>
      ) : (
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text className={`text-2xl font-bold ${
              financialSummary.balance >= 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              {formatCurrency(financialSummary.balance)}
            </Text>
            <Text className="text-app-textSecondary text-sm">Current Balance</Text>
          </View>
          
          <View className="w-px bg-gray-200 mx-4" />
          
          <View className="items-center flex-1">
            <Text className="text-primary-600 text-2xl font-bold">
              {financialSummary.transactionCount}
            </Text>
            <Text className="text-app-textSecondary text-sm">Transactions</Text>
          </View>
          
          <View className="w-px bg-gray-200 mx-4" />
          
          <View className="items-center flex-1">
            <Text className="text-warning-600 text-2xl font-bold">
              {formatCurrency(financialSummary.thisMonthExpenses)}
            </Text>
            <Text className="text-app-textSecondary text-sm">This Month</Text>
          </View>
        </View>
      )}
    </View>
  );

  const SettingsSection = ({ title, children }) => (
    <View className="mx-6 mb-4">
      <Text className="text-app-text text-lg font-semibold mb-3">{title}</Text>
      <View className="bg-white rounded-2xl shadow-card border border-gray-100">
        {children}
      </View>
    </View>
  );

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    rightElement,
    onPress,
    isLast = false,
  }) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="bg-primary-50 w-12 h-12 rounded-xl items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-app-text font-semibold text-base">{title}</Text>
        {subtitle && (
          <Text className="text-app-textSecondary text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      {rightElement && <View className="ml-4">{rightElement}</View>}
      {!rightElement && onPress && (
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-app-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader />

        {/* Stats Card */}
        <StatsCard />

        {/* Account Settings */}
        <View className="mt-6">
          <SettingsSection title="Account">
            <SettingsItem
              icon="👤"
              title="Personal Information"
              subtitle={`Name: ${getDisplayName()}`}
              onPress={() => setEditingName(true)}
            />
            <SettingsItem
              icon="📧"
              title="Email"
              subtitle={user?.email || 'No email'}
              onPress={() => Alert.alert('Email Change', 'Contact support to change email')}
            />
            <SettingsItem
              icon="🔒"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => Alert.alert('Feature Coming Soon', 'Password change will be available soon')}
            />
            <SettingsItem
              icon="🔐"
              title="Account Security"
              subtitle="Manage your account security settings"
              onPress={() => Alert.alert('Feature Coming Soon', 'Security settings will be available soon')}
              isLast={true}
            />
          </SettingsSection>

          {/* App Settings */}
          <SettingsSection title="App Settings">
            <SettingsItem
              icon="🔔"
              title="Notifications"
              subtitle="Enable push notifications"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
                />
              }
            />
            <SettingsItem
              icon="🔐"
              title="Biometric Lock"
              subtitle="Use fingerprint or face unlock"
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor={biometricEnabled ? '#3B82F6' : '#9CA3AF'}
                />
              }
            />
            <SettingsItem
              icon="🌙"
              title="Dark Mode"
              subtitle="Enable dark theme"
              rightElement={
                <Switch
                  value={false}
                  onValueChange={() => Alert.alert('Feature Coming Soon', 'Dark mode will be available soon')}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor="#9CA3AF"
                />
              }
            />
            <SettingsItem
              icon="💱"
              title="Currency"
              subtitle="INR (Indian Rupee)"
              onPress={() => Alert.alert('Feature Coming Soon', 'Multiple currencies will be available soon')}
            />
            <SettingsItem
              icon="🔄"
              title="Sync Status"
              subtitle="Data synchronization settings"
              onPress={() => Alert.alert('Sync Status', 'All data is synced with cloud storage')}
              isLast={true}
            />
          </SettingsSection>

          {/* Financial Overview */}
          <SettingsSection title="Financial Overview">
            <SettingsItem
              icon="📊"
              title="View Analytics"
              subtitle="Detailed financial insights"
              onPress={() => Alert.alert('Navigate', 'Go to Analytics tab to view detailed insights')}
            />
            <SettingsItem
              icon="💰"
              title="Export Data"
              subtitle="Download your transaction history"
              onPress={() => Alert.alert('Feature Coming Soon', 'Data export will be available soon')}
            />
            <SettingsItem
              icon="🗂️"
              title="Categories"
              subtitle="Manage income and expense categories"
              onPress={() => Alert.alert('Feature Coming Soon', 'Category management will be available soon')}
              isLast={true}
            />
          </SettingsSection>

          {/* Support */}
          <SettingsSection title="Support & About">
            <SettingsItem
              icon="❓"
              title="Help & Support"
              subtitle="Get help with MyPocket"
              onPress={() => Alert.alert('Support', 'Contact us at support@mypocket.app')}
            />
            <SettingsItem
              icon="📋"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => Alert.alert('Privacy Policy', 'Your privacy is important to us. View full policy on our website.')}
            />
            <SettingsItem
              icon="📄"
              title="Terms of Service"
              subtitle="Read our terms of service"
              onPress={() => Alert.alert('Terms of Service', 'View full terms on our website.')}
            />
            <SettingsItem
              icon="⭐"
              title="Rate MyPocket"
              subtitle="Rate us on the Play Store"
              onPress={() => Alert.alert('Rate App', 'Thank you for using MyPocket! Please rate us on the app store.')}
            />
            <SettingsItem
              icon="ℹ️"
              title="App Version"
              subtitle="MyPocket v1.0.0"
              isLast={true}
            />
          </SettingsSection>

          {/* Logout Section */}
          <View className="mx-6 mb-8">
            <TouchableOpacity
              className="bg-error-50 border border-error-200 rounded-2xl p-4 flex-row items-center justify-center shadow-soft"
              onPress={handleLogout}
              disabled={isLoggingOut}
              style={{
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <MaterialIcons name="logout" size={24} color="#DC2626" />
              <Text className="text-error-600 font-semibold text-lg ml-2">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
