// src/screens/auth/LandingScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo/Icon Section */}
        <View className="bg-primary-50 w-32 h-32 rounded-full items-center justify-center mb-8">
          <Text className="text-primary-500 text-6xl">💰</Text>
        </View>

        {/* Welcome Text */}
        <Text className="text-app-text text-4xl font-bold text-center mb-4">
          Welcome to MyPocket
        </Text>
        <Text className="text-app-textSecondary text-lg text-center mb-12 leading-6">
          Your personal expense tracker to manage finances smartly and achieve
          your savings goals
        </Text>

        {/* Features List */}
        <View className="w-full mb-12">
          <FeatureItem
            icon="📊"
            title="Track Expenses"
            description="Monitor your daily spending with ease"
          />
          <FeatureItem
            icon="💹"
            title="Analyze Trends"
            description="Get insights with beautiful charts"
          />
          <FeatureItem
            icon="🎯"
            title="Reach Goals"
            description="Set and achieve your financial targets"
          />
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-4">
          <TouchableOpacity
            className="bg-primary-500 py-4 rounded-2xl shadow-soft"
            onPress={() => navigation.navigate('Register')}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-primary-50 py-4 rounded-2xl border border-primary-200"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-primary-600 text-lg font-semibold text-center">
              I Already Have an Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
  <View className="flex-row items-center mb-6">
    <View className="bg-primary-100 w-12 h-12 rounded-xl items-center justify-center mr-4">
      <Text className="text-2xl">{icon}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-app-text font-semibold text-lg">{title}</Text>
      <Text className="text-app-textSecondary text-sm">{description}</Text>
    </View>
  </View>
);
