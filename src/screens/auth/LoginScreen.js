// src/screens/auth/LoginScreen.js
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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-12">
          <Text className="text-app-text text-3xl font-bold mb-2">
            Welcome Back!
          </Text>
          <Text className="text-app-textSecondary text-lg">
            Sign in to continue
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
        </View>

        <TouchableOpacity
          className="bg-primary-500 py-4 rounded-2xl shadow-soft mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-app-textSecondary">
            Don't have an account?{' '}
            <Text className="text-primary-500 font-semibold">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
