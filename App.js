import React, { Component, useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './components/auth/authScreen';
import HomeScreen from './screens/homeScreen';
import { initDatabase, resetDatabaseConnection } from './components/database/database';

const Stack = createStackNavigator();
const screenOptions = {
  headerStyle: {
    backgroundColor: '#16324f',
  },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    fontWeight: '700',
  },
};

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 8 }}>
            The app hit a runtime error instead of showing a white screen.
          </Text>
          <Text style={{ textAlign: 'center', color: '#475569' }}>
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [retrySeed, setRetrySeed] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err);
      }
    };

    initializeApp();
  }, [retrySeed]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Database initialization failed</Text>
        <Text>{error.message}</Text>
        <Button 
          title="Retry" 
          onPress={() => {
            resetDatabaseConnection();
            setError(null);
            setDbInitialized(false);
            setRetrySeed((value) => value + 1);
          }} 
        />
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing database...</Text>
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Food Journal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppErrorBoundary>
  );
};

export default App;
