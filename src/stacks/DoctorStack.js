import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
function TopBar({ onNotificationPress }) {
  return (
    <View style={styles.topBar}>
      {/* Left: Logo */}
      <Image
        source={require('../images/logo.png')} 
        style={styles.logo}
      />

      {/* Right: Notification Icon */}
      <TouchableOpacity onPress={onNotificationPress}>
        <Icon name="notifications-outline" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Home Screen</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Profile Screen</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Settings Screen</Text>
    </View>
  );
}

function NotificationsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Notifications Screen</Text>
    </View>
  );
}

export default function DoctorStack() {
  const handleNotificationPress = () => {
    console.log('Notification icon pressed');
  };

  return (
      <View style={styles.container}>
        <TopBar onNotificationPress={handleNotificationPress} />

        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else if (route.name === 'Notifications') {
                iconName = focused ? 'notifications' : 'notifications-outline';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="Notifications" component={NotificationsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 60,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  logo: {
    width: 130,
    height: 40,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
