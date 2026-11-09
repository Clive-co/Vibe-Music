import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useActiveColors } from "@/constants/ThemeMode";
import LottieView from "lottie-react-native";
import { AppleImg, GoogleImg } from "@/components/ProviderImg";
import { signUp, resendSignUpCode, signIn } from 'aws-amplify/auth';
import PhoneNumberPicker from "@/components/auth/PhoneNumberInput";

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();
  const activeColors = useActiveColors();
  const [loading, setLoading] = useState(false)
  const [preferred_username, setPreferred_username] = useState("");
  const [callingCode, setCallingCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [confirmPasswordHidden, setConfirmPasswordHidden] = useState(true);
  const [error, setError] = useState('')
  const [passwordMatchError, setPasswordMatchError] = useState("");

  // Function to check if passwords match
  const handlePasswordMatch = (text: any) => {
    setPassword(text);
    if (confirmPassword && text !== confirmPassword) {
      setPasswordMatchError("Passwords do not match");
    } else {
      setPasswordMatchError("");
    }
  };

  const handleConfirmPasswordMatch = (text: any) => {
    setConfirmPassword(text);
    if (password && text !== password) {
      setPasswordMatchError("Passwords do not match");
    } else {
      setPasswordMatchError("");
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const handleSignUp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const fullPhone = handleLogPhoneNumber();
      console.log('Full phone number:', fullPhone);

      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            phone_number: fullPhone,
            name: preferred_username,
            email: email,
          },
        },
      });

      console.log('Sign up response:', { isSignUpComplete, userId, nextStep });
      
      // Handle successful sign up
      if (isSignUpComplete) {
        setLoading(false);
        // User is immediately verified (rare case)
        router.push('(tabs)/');
      } else {
        // Normal case - user needs to verify
        setLoading(false);
        router.push(`/auth/verify?phonenumber=${encodeURIComponent(fullPhone)}&email=${encodeURIComponent(email)}&username=${encodeURIComponent(preferred_username)}&userId=${encodeURIComponent(userId || '')}`);
      }
      
    } catch (error: any) {
      console.log('Error signing up:', error);
      
      if (error.name === 'UsernameExistsException') {
        // User already exists, now check if they need verification
        try {
          // Try to sign in to check user status
          const signInResult = await signIn({
            username: email,
            password
          });
          
          console.log('Sign in result for existing user:', signInResult);
          
          // If sign in succeeds, user is verified but trying to sign up again
          if (signInResult.isSignedIn) {
            setError('Account already exists and is verified. Please sign in instead.');
          } else if (signInResult.nextStep) {
            // Handle cases where sign in succeeds but requires additional steps
            if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
              // User exists but needs verification
              try {
                await resendSignUpCode({
                  username: email
                });
                
                setError('Account exists but is unverified. We\'ve sent a new verification code to your email.');
                
                setTimeout(() => {
                  router.push(`/auth/verify?email=${encodeURIComponent(email)}&fromResend=true`);
                }, 3000);
                
              } catch (resendError: any) {
                if (resendError.name === 'LimitExceededException') {
                  setError('Too many attempts. Please try again later.');
                } else {
                  setError('Failed to resend verification code. Please try again.');
                }
              }
            } else {
              setError('Account already exists and is verified. Please sign in instead.');
            }
          }
          
        } catch (signInError: any) {
          console.log('Sign in error for existing user:', signInError);
          
          if (signInError.name === 'UserNotConfirmedException') {
            // User exists but is not verified, resend verification code
            try {
              await resendSignUpCode({
                username: email
              });
              
              setError('Account exists but is unverified. We\'ve sent a new verification code to your email.');
              
              setTimeout(() => {
                router.push(`/auth/verify?email=${encodeURIComponent(email)}&fromResend=true`);
              }, 3000);
              
            } catch (resendError: any) {
              if (resendError.name === 'LimitExceededException') {
                setError('Too many attempts. Please try again later.');
              } else {
                setError('Failed to resend verification code. Please try again.');
              }
            }
          } else if (signInError.name === 'NotAuthorizedException') {
            // Wrong password - user exists and might be verified, but wrong password
            setError('Account exists with this email. Please sign in with the correct password.');
          } else {
            setError('Email already exists. Please sign in instead.');
          }
        }
      } else if (error.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements. Please choose a stronger password.');
      } else if (error.name === 'InvalidParameterException') {
        setError('Invalid input. Please check your information and try again.');
      } else if (error.name === 'LimitExceededException') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(error.message || 'Sign up failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const LoadRender = () => {
    return (
      <View style={{
        height: '100%', width: '100%',
        backgroundColor: activeColors.buttonBackdrop,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
      }}>
        <View style={{ borderRadius: 20, height: '20%', width: '80%', backgroundColor: activeColors.background, justifyContent: 'center', alignItems: 'center', gap: 30, }}>
          <LottieView source={require('@/assets/lottie/settingUp.json')} style={{ width: '30%', height: '30%', }} autoPlay loop />
          <Text style={{ color: activeColors.text, }}>We're setting things up for you 😉</Text>
        </View>
      </View>
    )
  }

  const handleLogPhoneNumber = () => {
    const appendedPhoneNumber = `${callingCode}${phoneNumber}`;
    setFullPhoneNumber(appendedPhoneNumber);
    return appendedPhoneNumber;  // Return the full phone number synchronously
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "padding" : undefined}  //i made androids behavior undefined because of the margin i was getting at the bottom on close
      keyboardVerticalOffset={0}
      contentContainerStyle={{ backgroundColor: activeColors.background, flex: 1 }}
      style={{ flex: 1, backgroundColor: activeColors.background }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ backgroundColor: activeColors.background }}
      //bounces={false}
      >
        <View
          style={{
            padding: 25,
            //paddingTop: 50,
            paddingBottom: 20,
            backgroundColor: activeColors.background,
            flex: 1,
          }}
        >
          {/* <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color={activeColors.text} />
          </TouchableOpacity> */}

          <Text
            style={{
              fontFamily: "dmsans-bold",
              fontSize: 25,
              marginTop: 30,
              color: activeColors.text,
            }}
          >
            Create A New Account
          </Text>

          <Text
            style={{
              fontFamily: "dmsans",
              fontSize: 20,
              color: Colors.GRAY,
              marginTop: 10,
            }}
          >
            Welcome to the Party!
      </Text>


          {/* Phone number */}
          <View
            style={{
              marginTop: 25,
            }}
          >
            <Text
              style={{
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
                color: activeColors.text,
              }}
            >
              Phone Number
        </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
              <View style={{
                width: '30%',
                alignItems: 'center',
                justifyContent: 'center',
                // backgroundColor: 'red',
                borderWidth: 1,
                borderRadius: 15, borderColor: Colors.GRAY,
              }}>
                <PhoneNumberPicker onSelectCode={setCallingCode} />
              </View>
              <TextInput
                style={{
                  padding: 15,
                  borderWidth: 1,
                  width: '67%',
                  borderRadius: 15,
                  color: activeColors.text,
                  borderColor: Colors.GRAY,
                  fontFamily: "dmsans",
                }}
                placeholder="123456789"
                placeholderTextColor={'gray'}
                selectionColor={"#000"}
                keyboardType='numeric'
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
            {/* <Text onPress={()=> handleLogPhoneNumber()}>log</Text> */}
          </View>


          {/* Email */}
          <View
            style={{
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
                color: activeColors.text,
              }}
            >
              Email
            </Text>
            <TextInput
              style={{
                padding: 15,
                borderWidth: 1,
                borderRadius: 15,
                color: activeColors.text,
                borderColor: Colors.GRAY,
                fontFamily: "dmsans",
              }}
              keyboardType="email-address"
              placeholder="Enter Email"
              placeholderTextColor={Colors.GRAY}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* UserName */}
          <View
            style={{
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
                color: activeColors.text,
              }}
            >
              Username
            </Text>
            <TextInput
              style={{
                padding: 15,
                borderWidth: 1,
                borderRadius: 15,
                color: activeColors.text,
                borderColor: Colors.GRAY,
                fontFamily: "dmsans",
              }}
              placeholder="Enter unique username"
              placeholderTextColor={Colors.GRAY}
              value={preferred_username}
              onChangeText={setPreferred_username}
            />
          </View>

          {/* Password */}
          <View
            style={{
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
                color: activeColors.text,
              }}
            >
              Password
            </Text>
            <View style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
              position: 'relative',
              padding: 15,
              borderWidth: 1,
              borderRadius: 15,
              borderColor: Colors.GRAY,
            }}>
              <TextInput
                style={[{ color: activeColors.text, width: '90%', overflow: 'hidden', fontFamily: "dmsans", }]}
                secureTextEntry={passwordHidden}
                placeholder="Enter Password"
                placeholderTextColor={Colors.GRAY}
                value={password}
                onChangeText={handlePasswordMatch}
              />

              <Ionicons name={passwordHidden ? "eye-off-outline" : "eye-outline"} size={24} color={activeColors.text}
                onPress={() => setPasswordHidden(!passwordHidden)}
                style={{ shadowOpacity: 0, }} />
            </View>
          </View>



          {/* -------confirm password--------- */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: "dmsans", paddingBottom: 5, left: 5, color: activeColors.text }}>
              Confirm Password
  </Text>
            <View style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
              position: 'relative',
              padding: 15,
              borderWidth: 1,
              borderRadius: 15,
              borderColor: Colors.GRAY,
            }}>
              <TextInput
                style={[{ color: activeColors.text, width: '90%', overflow: 'hidden', fontFamily: "dmsans" }]}
                secureTextEntry={confirmPasswordHidden}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.GRAY}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordMatch}

              />
              <Ionicons
                name={confirmPasswordHidden ? "eye-off-outline" : "eye-outline"}
                size={24}
                color={activeColors.text}
                onPress={() => setConfirmPasswordHidden(!confirmPasswordHidden)}
                style={{ shadowOpacity: 0 }}
              />
            </View>
            {passwordMatchError ? (
              <Text style={{ color: "red", fontFamily: "dmsans", marginTop: 5 }}>
                {passwordMatchError}
              </Text>
            ) : null}
          </View>

          {error ? (
            <Text style={{ color: 'red', marginTop: 15, }}>{String(error)}</Text>
          ) : undefined}
          {/* Create Account Button */}
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              handleSignUp()
            }}
            disabled={!!passwordMatchError || !password || !confirmPassword || !preferred_username || !email || !phoneNumber}
            style={{
              padding: 15,
              backgroundColor: !!passwordMatchError || !email || !phoneNumber || !preferred_username || !password || !confirmPassword ? Colors.GRAY : Colors.PRIMARY,
              borderRadius: 15,
              marginTop: 30,
              shadowOpacity: 0.2,
              elevation: 2,
            }}

          >
            {loading ? (
              <ActivityIndicator />
            ) : (
                <Text
                  style={{
                    color: Colors.WHITE,
                    textAlign: "center",
                  }}
                >
                  Create Account
                </Text>
              )
            }
          </TouchableOpacity>

          {/* --------------------Sign up options Start---------------------- */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: activeColors.background2,
              borderRadius: 15,
              marginTop: 10,
              flexDirection: "row",
              alignItems: 'center', justifyContent: 'center',
              gap: 5,
            }}
          >
            <AppleImg fill={activeColors.text} />
            <Text style={{ color: Colors.GRAY, fontSize: 13, }}>Sign up with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: activeColors.background2,
              borderRadius: 15,
              marginTop: 10,
              flexDirection: "row",
              alignItems: 'center', justifyContent: 'center',
              gap: 5,
            }}
          >
            <GoogleImg />
            <Text style={{ color: Colors.GRAY, fontSize: 13, }}>Sign up with Google</Text>
          </TouchableOpacity>
          {/* --------------------Sign up options End---------------------- */}

          {/* Sign In Button */}
          <Text style={{ color: Colors.GRAY, marginTop: 15, }}>Already Vibing?
        <Text style={{ color: activeColors.colorText, }} onPress={() => router.replace("/auth/sign-in")}> Sign in</Text>
          </Text>
        </View>

      </ScrollView>
      {/* {loading ? <LoadRender/> : undefined } */}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {},
});