import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert
} from "react-native";
import { Colors } from "@/constants/Colors";
import { AntDesign } from "@expo/vector-icons";
import { useActiveColors } from "@/constants/ThemeMode";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import axios from "axios";
import { createUser, deleteUser } from "@/utils/service_api/userServiceApi";

interface LocalSearchParams {
  phonenumber?: string;
  email?: string;
  username?: string;
  userId?: string;
  fromSignIn?: string;
  fromResend?: string;
}

interface IPInfoResponse {
  country: string;
  timezone: string;      
}

const VerifyEmail: React.FC = () => {
  const activeColors = useActiveColors();
  const router = useRouter();
  const { phonenumber, email, username, userId, fromSignIn, fromResend } =
    useLocalSearchParams() as LocalSearchParams;

  const height = useHeaderHeight();

  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [confirmationCode, setConfirmationCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [timezone, setTimezone] = useState("");

  // Determine if this is coming from sign-in or resend flow
  const isFromSignInOrResend = fromSignIn === 'true' || fromResend === 'true';

  // Fetch the user's region using IPinfo API
  useEffect(() => {
    const ipInfo = process.env.EXPO_PUBLIC_IPINFO!;
    
    const fetchGeo = async () => {
      try {
        const response = await axios.get<IPInfoResponse>(
          `https://ipinfo.io?token=${ipInfo}`
        );
        setRegion(response.data.country); // Extract the country code (e.g., 'US', 'NG')
        setTimezone(response.data.timezone);
      } catch (err) {
        console.error("Error fetching region:", err);
        setRegion("Unknown"); // Fallback if API fails
      }
    };

    fetchGeo(); // Call the fetchRegion function
  }, []);

  const handleResendCode = async () => {
    if (!email) {
      setError("Email is required to resend code");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      await resendSignUpCode({
        username: email
      });
      
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
    } catch (error: any) {
      console.log("Error resending code:", error);
      
      if (error.name === 'LimitExceededException') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(error.message || 'Failed to resend code');
      }
    } finally {
      setResendLoading(false);
    }
  };

  // Confirm sign-up and call createUser after successful confirmation
  const handleSignUpConfirmation = async () => {
    setError("");
    setLoading(true);

    try {
      if (!email || !confirmationCode) {
        setError("Email or confirmation code is missing.");
        setLoading(false);
        return;
      }

      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode,
      });

      if (isSignUpComplete) {
        if (isFromSignInOrResend) {
          // If coming from sign-in or resend, just redirect to sign-in
          Alert.alert(
            "Email Verified",
            "Your email has been verified. You can now sign in.",
            [
              {
                text: "OK",
                onPress: () => router.push("/auth/sign-in")
              }
            ]
          );
        } else {
          // If coming from normal sign-up flow, create user
          if (!username || !phonenumber || !userId) {
            setError("Missing required user information for account creation.");
            setLoading(false);
            return;
          }

          const userCreated = await createUser({
            id: userId,
            username,
            email,
            phonenumber,
            profileImg: "https://vibe-profile-images.s3.us-east-1.amazonaws.com/profile1.jpg",
            desc: "",
            linkedAccount: "none",
            spotifyAccessToken: "",
            spotifyRefreshToken: "",
            spotifyTokenExpiration: "",
            appleMusicAccessToken: "",
            isPremium: false,
            region,
            timezone,
            joinedAt: new Date().toLocaleDateString(),
          });

          if (userCreated) {
            router.push("/auth/sign-in");
          } else {
            setError("Failed to create user account.");
            if (userId) await deleteUser(userId);
            router.push("/auth/sign-up");
          }
        }
      } else {
        setError("Verification failed. Please try again.");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message || "Error confirming sign-up.");
      console.log("Error confirming sign up", e);
      
      if (!isFromSignInOrResend && userId) {
        await deleteUser(userId);
      }
      
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={height}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={{
            backgroundColor: activeColors.background,
            flex: 1,
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <Text
            style={{
              color: activeColors.text,
              fontWeight: "bold",
              fontSize: 20,
              alignSelf: "center",
            }}
          >
            Verify Your Email Address
          </Text>

          <View style={{ gap: 20, width: "80%" }}>
            <Text style={styles.instructionText}>
              -To start Vibing, Enter the code we sent to your email
            </Text>
            <Text style={styles.instructionText}>
              -This enables us to confirm you own the email
            </Text>
            <Text style={styles.instructionText}>
              -Your account will be activated if the correct code is inserted
            </Text>
          </View>

          <TextInput
            placeholder="code"
            placeholderTextColor={Colors.GRAY}
            keyboardType="default"
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            style={{
              width: "80%",
              padding: 16,
              backgroundColor: activeColors.background2,
              borderRadius: 99,
              fontSize: 16,
              color: activeColors.text,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: Colors.GRAY,
            }}
          />

          <TouchableOpacity
            style={{
              padding: 15,
              width: "80%",
              backgroundColor: Colors.PRIMARY,
              borderRadius: 99,
              shadowOpacity: 0.2,
              elevation: 2,
            }}
            onPress={() => {
              setLoading(true);
              handleSignUpConfirmation();
            }}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
                <Text style={{ color: Colors.WHITE, textAlign: "center", fontSize: 15 }}>
                  Verify <AntDesign name="arrowright" size={13} />
                </Text>
              )}
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  instructionText: {
    color: Colors.GRAY,
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default VerifyEmail;
