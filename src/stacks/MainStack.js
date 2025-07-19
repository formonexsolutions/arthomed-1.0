import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/auth/Login';
import CreateAccount from '../screens/auth/CreateAccount';
import OtpVerify from '../screens/auth/OtpVerify';
import DoctorStack from './DoctorStack';

const Stack = createStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator initialRouteName="DoctorStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="CreateAccount" component={CreateAccount} />
      <Stack.Screen name="OtpVerify" component={OtpVerify} />
       <Stack.Screen name="DoctorStack" component={DoctorStack} />
    </Stack.Navigator>
  );
};

export default MainStack;
