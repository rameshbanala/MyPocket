// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-12">
          <Text className="text-app-text text-3xl font-bold mb-2">
            Create Account
          </Text>
          <Text className="text-app-textSecondary text-lg">
            Join MyPocket today
          </Text>
        </View>

        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-app-text font-medium mb-2">Email</Text>
            <TextInput
              className="bg-app-surface border border-app-border rounded-xl px-4 py-4 text-app-text"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-app-text font-medium mb-2">Password</Text>
            <TextInput
              className="bg-app-surface border border-app-border rounded-xl px-4 py-4 text-app-text"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View>
            <Text className="text-app-text font-medium mb-2">
              Confirm Password
            </Text>
            <TextInput
              className="bg-app-surface border border-app-border rounded-xl px-4 py-4 text-app-text"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary-500 py-4 rounded-2xl shadow-soft mb-4"
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-app-textSecondary">
            Already have an account?{' '}
            <Text className="text-primary-500 font-semibold">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
