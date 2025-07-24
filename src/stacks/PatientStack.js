import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import MyBookingsScreen from '../screens/patientScreens/MyBookingsScreen';
import DashBoard from '../screens/patientScreens/DashBoard';
import ProfileScreen from '../screens/patientScreens/ProfileScreen';

const Tab = createBottomTabNavigator();




function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Chat Screen</Text>
    </View>
  );
}


function TopBar({ onNotificationPress }) {
  return (
   <View style={styles.header}>
  <View style={styles.headerLeft}>
    <Image source={require('../images/logo2.png')} style={styles.logo} />
  </View>
  <TouchableOpacity onPress={onNotificationPress}>
     <Icon name="notifications-outline" size={24} color="#fff" style={styles.notificationIcon} />
  </TouchableOpacity>
</View>
  );
}


export default function PatientStack({navigation}) {
  const handleNotificationPress = () => {
    navigation.navigate('NotificationScreen');
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
              } else if (route.name === 'Chat') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Appointment') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4B2EDE',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" component={DashBoard} />
          <Tab.Screen name="Appointment" component={MyBookingsScreen} />
          <Tab.Screen name="Chat" component={SettingsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
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
  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#5B67CA',
  paddingHorizontal:15,
 paddingVertical:7
},
headerLeft: {
  flexDirection: 'row',
},
logo: {
  height: 60,
  width: 130,
},
headerSubtitle: {
  color: '#fff',
  fontSize: 12,
},
});
