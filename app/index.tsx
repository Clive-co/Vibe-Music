import { Text, View, ActivityIndicator } from "react-native";
import * as Linking from 'expo-linking'
import Onboarding from "../components/Onboarding";
import React, { useEffect, useState, useContext } from "react";
import { Redirect } from "expo-router";
//import { activeColors, theme } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { getCurrentUser } from "aws-amplify/auth"; // Import getCurrentUser from aws-amplify/auth
import { useActiveColors } from "@/constants/ThemeMode";
import { Hub } from "@aws-amplify/core";

export default function Index() {

  const activeColors = useActiveColors();
  const [user, setUser] = useState<null | object | undefined>(undefined); // Allow `null`, `undefined`, or user object

  const checkUser = async () => {
    try {
      // Use getCurrentUser to get the current authenticated user
      const authUser = await getCurrentUser();

      // If the user is authenticated, set the state with user information
      if (authUser) {
        console.log(authUser);
        setUser(authUser);
      }
    } catch (error) {
      if ((error as any).name === "UserUnAuthenticatedException") {
        setUser(null); // Set state to `null` if the user is not authenticated
      } else {
        console.log("Error fetching user:", error);
        setUser(null); // Set state to `null` for other errors
      }
    }
  };

  useEffect(() => {
    checkUser(); // Check the user's authentication status when the component mounts

    // Listener to handle authentication events
    const listener = (data) => {
      if (data.payload.event === 'signIn' || data.payload.event === 'signOut') {
        console.log("Auth event received: ", data.payload.event);
        checkUser(); // Re-check user authentication status on auth events
      }
    };

    // Register the Hub listener for authentication events
    const hubListener = Hub.listen('auth', listener);

    // Cleanup function to remove the listener to prevent memory leaks
    return () => {
      hubListener(); // Properly unregister the listener
    };
  }, []);

  // Display a loading spinner while fetching user data
  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Redirect based on user authentication status
  return (
    <>
      {user ? ( 
        <Redirect href="(tabs)/" /> // Redirect to the main app screen if user is authenticated
      ) : (
        <Redirect href="auth/sign-in" /> // Redirect to sign-in screen if user is not authenticated
      )}
    </>
  );
}
