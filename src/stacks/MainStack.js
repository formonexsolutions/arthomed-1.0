import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/auth/Login';
import CreateAccount from '../screens/auth/CreateAccount';
import OtpVerify from '../screens/auth/OtpVerify';
import DoctorStack from './DoctorStack';
import PatientStack from './PatientStack';
import NotificationScreen from '../screens/patientScreens/NotificationScreen';

const Stack = createStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator initialRouteName="PatientStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="CreateAccount" component={CreateAccount} />
      <Stack.Screen name="OtpVerify" component={OtpVerify} />
       <Stack.Screen name="DoctorStack" component={DoctorStack} />
       <Stack.Screen name="PatientStack" component={PatientStack} />
       <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
