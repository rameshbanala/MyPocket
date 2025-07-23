// src/screens/auth/RegisterScreen.js (Updated with Name Field)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters long');
      return;
    }

    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long',
      );
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      Alert.alert(
        'Welcome to MyPocket! 🎉',
        `Hello ${name}! Your account has been created successfully.`,
        [{ text: 'Continue', onPress: () => {} }],
      );
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage =
          'This email is already registered. Please use a different email or sign in.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage =
          'Password is too weak. Please choose a stronger password.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-8 py-12">
          {/* Header */}
          <View className="items-center mb-12">
            <View className="bg-primary-50 w-20 h-20 rounded-full items-center justify-center mb-6">
              <Text className="text-primary-500 text-4xl">👤</Text>
            </View>
            <Text className="text-app-text text-3xl font-bold mb-2">
              Create Account
            </Text>
            <Text className="text-app-textSecondary text-lg text-center">
              Join MyPocket and start managing your finances smartly
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-6 mb-8">
            {/* Name Field */}
            <View>
              <Text className="text-app-text font-semibold mb-3 text-base">
                Full Name *
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-app-surface border border-app-border rounded-2xl px-4 py-4 pr-12 text-app-text text-base"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                />
                <View className="absolute right-4 top-4">
                  <MaterialIcons name="person" size={24} color="#9CA3AF" />
                </View>
              </View>
            </View>

            {/* Email Field */}
            <View>
              <Text className="text-app-text font-semibold mb-3 text-base">
                Email Address *
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-app-surface border border-app-border rounded-2xl px-4 py-4 pr-12 text-app-text text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <View className="absolute right-4 top-4">
                  <MaterialIcons name="email" size={24} color="#9CA3AF" />
                </View>
              </View>
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-app-text font-semibold mb-3 text-base">
                Password *
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-app-surface border border-app-border rounded-2xl px-4 py-4 pr-12 text-app-text text-base"
                  placeholder="Create a strong password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View>
              <Text className="text-app-text font-semibold mb-3 text-base">
                Confirm Password *
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-app-surface border border-app-border rounded-2xl px-4 py-4 pr-12 text-app-text text-base"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`py-4 rounded-2xl shadow-soft mb-6 ${
              loading ? 'bg-gray-300' : 'bg-primary-500'
            }`}
            onPress={handleRegister}
            disabled={loading}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: loading ? 0 : 0.3,
              shadowRadius: 8,
              elevation: loading ? 0 : 6,
            }}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            className="items-center"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-app-textSecondary text-base">
              Already have an account?{' '}
              <Text className="text-primary-500 font-semibold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
