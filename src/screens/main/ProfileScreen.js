// src/screens/main/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const ProfileHeader = () => (
    <View className="bg-primary-500 px-6 py-8 rounded-b-3xl">
      <View className="items-center">
        {/* Profile Avatar */}
        <View className="bg-white w-24 h-24 rounded-full items-center justify-center shadow-lg mb-4">
          <Text className="text-primary-500 text-4xl font-bold">
            {user?.email?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>

        {/* User Info */}
        <Text className="text-white text-2xl font-bold mb-1">
          {user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text className="text-primary-100 text-base">
          {user?.email || 'user@example.com'}
        </Text>

        {/* Member Since */}
        <View className="bg-primary-600 px-4 py-2 rounded-full mt-4">
          <Text className="text-white text-sm font-medium">
            Member since {new Date().getFullYear()}
          </Text>
        </View>
      </View>
    </View>
  );

  const StatsCard = () => (
    <View className="mx-6 -mt-8 bg-white rounded-2xl p-6 shadow-card border border-gray-100">
      <Text className="text-app-text text-lg font-semibold mb-4">
        Quick Stats
      </Text>
      <View className="flex-row justify-between">
        <View className="items-center flex-1">
          <Text className="text-success-600 text-2xl font-bold">₹25,450</Text>
          <Text className="text-app-textSecondary text-sm">
            Current Balance
          </Text>
        </View>
        <View className="w-px bg-gray-200 mx-4" />
        <View className="items-center flex-1">
          <Text className="text-primary-600 text-2xl font-bold">156</Text>
          <Text className="text-app-textSecondary text-sm">Transactions</Text>
        </View>
        <View className="w-px bg-gray-200 mx-4" />
        <View className="items-center flex-1">
          <Text className="text-warning-600 text-2xl font-bold">₹2,850</Text>
          <Text className="text-app-textSecondary text-sm">This Month</Text>
        </View>
      </View>
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
      className={`flex-row items-center p-4 ${!isLast ? 'border-b border-gray-100' : ''}`}
      onPress={onPress}
    >
      <View className="bg-primary-50 w-12 h-12 rounded-xl items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-app-text font-semibold text-base">{title}</Text>
        {subtitle && (
          <Text className="text-app-textSecondary text-sm mt-1">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View className="ml-4">{rightElement}</View>}
      {!rightElement && <Text className="text-gray-400 text-xl ml-4">›</Text>}
    </TouchableOpacity>
  );

  return (
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
            subtitle="Update your personal details"
            onPress={() => Alert.alert('Feature Coming Soon')}
          />
          <SettingsItem
            icon="🔒"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => Alert.alert('Feature Coming Soon')}
          />
          <SettingsItem
            icon="📧"
            title="Email Preferences"
            subtitle="Manage email notifications"
            onPress={() => Alert.alert('Feature Coming Soon')}
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
                onValueChange={() => Alert.alert('Feature Coming Soon')}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor="#9CA3AF"
              />
            }
          />
          <SettingsItem
            icon="💱"
            title="Currency"
            subtitle="INR (Indian Rupee)"
            onPress={() => Alert.alert('Feature Coming Soon')}
            isLast={true}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help with MyPocket"
            onPress={() => Alert.alert('Feature Coming Soon')}
          />
          <SettingsItem
            icon="📋"
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => Alert.alert('Feature Coming Soon')}
          />
          <SettingsItem
            icon="📄"
            title="Terms of Service"
            subtitle="Read our terms of service"
            onPress={() => Alert.alert('Feature Coming Soon')}
          />
          <SettingsItem
            icon="⭐"
            title="Rate MyPocket"
            subtitle="Rate us on the Play Store"
            onPress={() => Alert.alert('Feature Coming Soon')}
            isLast={true}
          />
        </SettingsSection>

        {/* Logout Section */}
        <View className="mx-6 mb-8">
          <TouchableOpacity
            className="bg-error-50 border border-error-200 rounded-2xl p-4 flex-row items-center justify-center shadow-soft"
            onPress={handleLogout}
          >
            <Text className="text-error-600 text-2xl mr-3">🚪</Text>
            <Text className="text-error-600 font-semibold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
