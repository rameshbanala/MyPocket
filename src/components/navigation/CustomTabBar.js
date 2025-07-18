/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  if (focusedOptions.tabBarVisible === false) {
    return null;
  }

  const getIcon = (routeName, focused) => {
    let iconName;
    let IconComponent;
    const iconSize = focused ? 24 : 22;
    const color = focused ? '#3B82F6' : '#6B7280';

    switch (routeName) {
      case 'Home':
        IconComponent = MaterialIcons;
        iconName = focused ? 'home' : 'home';
        break;
      case 'Analytics':
        IconComponent = MaterialCommunityIcons;
        iconName = focused ? 'chart-line' : 'chart-line-variant';
        break;
      case 'Add':
        IconComponent = MaterialIcons;
        iconName = 'add';
        break;
      case 'Wallet':
        IconComponent = Ionicons;
        iconName = focused ? 'wallet' : 'wallet-outline';
        break;
      case 'Profile':
        IconComponent = MaterialIcons;
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        IconComponent = MaterialIcons;
        iconName = 'help';
    }

    return <IconComponent name={iconName} size={iconSize} color={color} />;
  };

  const TabButton = ({ route, index, focused }) => {
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    // Special handling for the Add button (middle button)
    if (route.name === 'Add') {
      return (
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          className="items-center justify-center"
          style={{
            width: 70,
            height: 70,
            marginTop: -10,
            marginHorizontal: 5,
            marginBottom: 25,
          }}
          activeOpacity={0.8}
        >
          <View
            className="bg-primary-500 w-20 h-20 rounded-full items-center justify-center"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <MaterialIcons name="add" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        className="flex-1 items-center justify-center py-2"
        activeOpacity={0.7}
      >
        <View className="items-center">
          {getIcon(route.name, focused)}
          <Text
            className={`text-xs mt-1 font-medium ${
              focused ? 'text-primary-500' : 'text-gray-500'
            }`}
          >
            {route.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="bg-white"
       style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 18,
        paddingBottom: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
      }}
    >
      <View
        className="flex-row items-center justify-between px-4"
        style={{ height: 64 }}
      >
        {/* Left Container (First two tabs) */}
        <View
          className="flex-row bg-gray-50 rounded-2xl"
          style={{ 
            flex: 3.2,
            height: 60,
            marginRight: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {state.routes.slice(0, 2).map((route, index) => (
            <TabButton
              key={route.key}
              route={route}
              index={index}
              focused={state.index === index}
            />
          ))}
        </View>

        {/* Middle Add Button */}
        <View className="items-center justify-center">
          <TabButton
            route={state.routes[2]}
            index={2}
            focused={state.index === 2}
          />
        </View>

        {/* Right Container (Last two tabs) */}
        <View
          className="flex-row bg-gray-50 rounded-2xl"
          style={{ 
            flex: 3.2,
            height: 60,
            marginLeft: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {state.routes.slice(3, 5).map((route, index) => (
            <TabButton
              key={route.key}
              route={route}
              index={index + 3}
              focused={state.index === index + 3}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default CustomTabBar;
