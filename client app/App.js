import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#FF69B4" barStyle="light-content" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;