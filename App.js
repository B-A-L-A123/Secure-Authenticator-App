import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Authenticator from './src/pages/Authenticator';
import WebsiteCheck from './src/pages/Websitecheck';
import NetworkScanner from './src/pages/NetworkScanner';
import { CONFIG } from './config';

const Tab = createBottomTabNavigator();

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: CONFIG.GOOGLE_WEB_CLIENT_ID,
  iosClientId: CONFIG.GOOGLE_IOS_CLIENT_ID,
  androidClientId: CONFIG.GOOGLE_ANDROID_CLIENT_ID,
});

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const userData = {
        id: userInfo.user.id,
        name: userInfo.user.name,
        email: userInfo.user.email,
        picture: userInfo.user.photo,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setShowLogin(false);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Sign in error:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <NavigationContainer>
      <View className="flex-1 bg-[#213448]">
        <View className="h-16 flex-row items-center justify-between px-6 bg-[#547792] border-b border-[#94B4C1]/20">
          <Text className="text-xl font-bold text-[#EAE0CF]">Security Suite</Text>
          
          <TouchableOpacity
            onPress={() => user ? null : setShowLogin(true)}
            className="w-10 h-10 rounded-full bg-[#94B4C1] items-center justify-center overflow-hidden"
          >
            {user?.picture ? (
              <Image 
                source={{ uri: user.picture }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : user ? (
              <Text className="text-[#213448] font-bold">
                {user.name[0].toUpperCase()}
              </Text>
            ) : (
              <Text className="text-[#213448] font-bold">U</Text>
            )}
          </TouchableOpacity>
        </View>

        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#547792',
              borderTopColor: '#94B4C1',
              borderTopWidth: 1,
            },
            tabBarActiveTintColor: '#EAE0CF',
            tabBarInactiveTintColor: '#94B4C1',
          }}
        >
          <Tab.Screen
            name="Authenticator"
            component={AuthenticatorWrapper}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔐</Text>,
            }}
            initialParams={{ user, showLogin: () => setShowLogin(true) }}
          />
          <Tab.Screen
            name="Web Scanner"
            component={WebsiteCheck}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🌐</Text>,
            }}
          />
          <Tab.Screen
            name="Network Scanner"
            component={NetworkScanner}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📱</Text>,
            }}
          />
        </Tab.Navigator>

        {/* Login Modal */}
        <Modal
          visible={showLogin}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogin(false)}
        >
          <View className="flex-1 items-center justify-center bg-black/70 p-4">
            <View className="bg-[#547792] w-full max-w-sm rounded-3xl p-8 border border-white/10">
              <Text className="text-2xl font-bold text-white mb-2">Sign in</Text>
              <Text className="text-white/70 mb-6">
                Sign in to sync your authenticator accounts
              </Text>

              <GoogleSigninButton
                style={{ width: '100%', height: 48 }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleSignIn}
              />

              <TouchableOpacity
                onPress={() => setShowLogin(false)}
                className="w-full mt-4"
              >
                <Text className="text-white/60 text-center text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* User Profile Modal (shown when tapping user avatar) */}
        {user && (
          <Modal
            visible={false}
            transparent
            animationType="fade"
          >
            <View className="flex-1 items-center justify-center bg-black/70 p-4">
              <View className="bg-[#547792] rounded-xl p-4 w-64">
                <View className="flex-row items-center gap-3 mb-3">
                  {user.picture ? (
                    <Image 
                      source={{ uri: user.picture }} 
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-[#94B4C1] items-center justify-center">
                      <Text className="text-[#213448] font-bold text-xl">
                        {user.name[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-white">{user.name}</Text>
                    <Text className="text-sm text-white/60">{user.email}</Text>
                  </View>
                </View>
                <View className="text-xs text-white/40 mb-3 p-2 bg-black/20 rounded">
                  <Text className="text-white/40 text-xs">ID: {user.id.slice(0, 12)}...</Text>
                </View>
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="w-full py-2 px-4 bg-[#213448] rounded-lg"
                >
                  <Text className="text-white text-center text-sm font-semibold">
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </NavigationContainer>
  );
}

// Wrapper component to handle authentication requirement
function AuthenticatorWrapper({ route }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-[#213448] p-6">
        <Text className="text-6xl mb-4">🔐</Text>
        <Text className="text-2xl font-bold text-[#EAE0CF] mb-2">
          Sign in to use Authenticator
        </Text>
        <Text className="text-white/60 mb-6 text-center">
          Your authenticator codes will be synced to your account
        </Text>
        <TouchableOpacity
          onPress={() => route.params?.showLogin()}
          className="px-6 py-3 bg-blue-500 rounded-xl"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Authenticator />;
}

export default App;
