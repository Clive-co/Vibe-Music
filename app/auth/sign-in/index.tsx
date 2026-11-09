import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useActiveColors } from "@/constants/ThemeMode";
import { AppleImg, GoogleImg } from "@/components/ProviderImg";
import { signInWithRedirect, signIn, resendSignUpCode } from "aws-amplify/auth";
import PhoneNumberPicker from "@/components/auth/PhoneNumberInput";

export default function SignIn() {
  const naviagtion = useNavigation();
  const router = useRouter();
  const activeColors = useActiveColors();
  const [callingCode, setCallingCode] = useState('');
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [password, setPassword] = useState("");
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordHidden, setPasswordHidden] = useState(true)
  const inputRef = useRef(null)

  const handleLogPhoneNumber = () => {
    const appendedPhoneNumber = `${callingCode}${phoneNumber}`;
    setFullPhoneNumber(appendedPhoneNumber)
    console.log(fullPhoneNumber);  // Log the full phone number
  }

  const handleLogin = async () => {
    handleLogPhoneNumber();
    setError('');
    setLoading(true);
    
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });
      
      console.log('Sign in response:', { isSignedIn, nextStep }); // Add this for debugging
      
      if (isSignedIn) {
        setLoading(false);
        router.push('(tabs)/');
      } else if (nextStep) {
        // Handle different nextStep scenarios
        console.log('Next step:', nextStep);
        
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          // User needs to verify their account
          try {
            await resendSignUpCode({
              username: email
            });
            
            setError('Account is not verified. We\'ve sent a new verification code to your email.');
            
            setTimeout(() => {
              router.push(`/auth/verify?email=${encodeURIComponent(email)}&fromSignIn=true`);
            }, 2000);
            
          } catch (resendError: any) {
            if (resendError.name === 'LimitExceededException') {
              setError('Too many attempts. Please try again later.');
            } else {
              setError('Account not verified. Please check your email for verification code.');
              setTimeout(() => {
                router.push(`/auth/verify?email=${encodeURIComponent(email)}&fromSignIn=true`);
              }, 2000);
            }
          }
        } else {
          // Handle other nextStep scenarios
          setError('Additional authentication step required.');
        }
        
        setLoading(false);
      } else {
        // Unexpected response
        setError('Sign in failed. Please try again.');
        setLoading(false);
      }
      
    } catch (e: any) {
      console.log('Sign in error:', e);
      
      // Handle unverified user
      if (e.name === 'UserNotConfirmedException') {
        // User exists but is not verified
        try {
          await resendSignUpCode({
            username: email
          });
          
          setError('Account is not verified. We\'ve sent a new verification code to your email.');
          
          setTimeout(() => {
            router.push(`/auth/verify?email=${encodeURIComponent(email)}&fromSignIn=true`);
          }, 2000);
          
        } catch (resendError: any) {
          if (resendError.name === 'LimitExceededException') {
            setError('Too many attempts. Please try again later.');
          } else {
            setError('Account not verified. Please check your email for verification code.');
            setTimeout(() => {
              router.push(`/auth/verify?email=${encodeURIComponent(email)}&fromSignIn=true`);
            }, 2000);
          }
        }
      } else if (e.name === 'NotAuthorizedException') {
        setError('Invalid email or password');
      } else if (e.name === 'UserNotFoundException') {
        setError('No account found with this email');
      } else {
        setError(e.message || 'Sign in failed');
      }
      
      setLoading(false);
    }
  };

  useEffect(() => {
    naviagtion.setOptions({
      headerShown: false,
    });
  }, []);

  return (
    
    <View style={{flex: 1, backgroundColor: activeColors.background,}}>
    <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "padding" : undefined}  //i made androids behavior undefined because of the margin i was getting at the bottom on close
      //keyboardVerticalOffset={0}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      contentContainerStyle={{
        backgroundColor: activeColors.background,
        flex: 1,
      }}
      style={{  flex: 1, backgroundColor: activeColors.background }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ backgroundColor: activeColors.background }}
        //bounces={false}
        style={{flex:1}}
      >
        <View
          style={{
            padding: 25,
            //paddingTop: 50,
            backgroundColor: activeColors.background,
            flex: 1,
          }}
        >
          {/* <TouchableOpacity onPress={()=> router.back()}>
        <AntDesign name="arrowleft" size={24} color={activeColors.text}/>
      </TouchableOpacity> */}

          {/* ----------------------Header Text Start-------------------------------- */}
          <Text
            style={{
              fontFamily: "dmsans-bold",
              fontSize: 30,
              marginTop: 30,
              color: activeColors.text,
            }}
          >
            Let's Sign You In
          </Text>

          <Text
            style={{
              fontFamily: "dmsans",
              fontSize: 30,
              color: Colors.GRAY,
              marginTop: 20,
            }}
          >
            Welcome Back
          </Text>

          <Text
            style={{
              fontFamily: "dmsans",
              fontSize: 25,
              color: Colors.GRAY,
              marginTop: 10,
            }}
          >
            We've missed your vibe!
          </Text>
          {/* ----------------------Header Text End-------------------------------- */}

          {/* ----------------------Sign in Options Start-------------------------------- */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 50,
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                signInWithRedirect({ provider: "Google" });
              }}
              style={{
                //padding: 20,
                width: "48%",
                height: 50,
                borderRadius: 10,
                //backgroundColor: 'rgba(74, 34, 122, 0.25)',
                backgroundColor: "rgba(117, 97, 129, 0.15)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <GoogleImg />
              <Text style={{ color: Colors.GRAY, fontSize: 13 }}>
                Sign in with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                //padding: 20,
                width: "48%",
                height: 50,
                borderRadius: 10,
                backgroundColor: activeColors.background2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <AppleImg fill={activeColors.text} />
              <Text style={{ color: Colors.GRAY, fontSize: 13 }}>
                Sign in with Apple
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              marginTop: 25,
              alignItems: "center",
              gap: 5,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                width: "46%",
                backgroundColor: Colors.GRAY,
              }}
            />
            <Text style={{ color: Colors.GRAY }}>OR</Text>
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                width: "46%",
                backgroundColor: Colors.GRAY,
              }}
            />
          </View>
          {/* ----------------------Sign in Options End-------------------------------- */}

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

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View
                style={{
                  width: "30%",
                  alignItems: "center",
                  justifyContent: "center",
                  // backgroundColor: 'red',
                  borderWidth: 1,
                  borderRadius: 15,
                  borderColor: Colors.GRAY,
                }}
              >
                <PhoneNumberPicker onSelectCode={setCallingCode} />
              </View>
              <TextInput
                style={{
                  padding: 15,
                  borderWidth: 1,
                  width: "67%",
                  borderRadius: 15,
                  color: activeColors.text,
                  borderColor: Colors.GRAY,
                  fontFamily: "dmsans",
                }}
                placeholder="123456789"
                placeholderTextColor={"gray"}
                selectionColor={"#000"}
                keyboardType="numeric"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
            {/* <Text onPress={()=> handleLogPhoneNumber()}>log</Text> */}
          </View>

          {/* Password */}
          <View
            style={{
              marginTop: 20,
            }}
          >
            <Text
              style={{
                color: activeColors.text,
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
              }}
            >
              Password
            </Text>

            <View
              style={[
                styles.input,
                {
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexDirection: "row",
                  position: "relative",
                  padding: 0,
                  paddingHorizontal: 15,
                },
              ]}
            >
              <TextInput
                style={[
                  {
                    color: activeColors.text,
                    width: "90%",
                    overflow: "hidden",
                    fontFamily: "dmsans",
                    paddingVertical: 15,
                  },
                ]}
                secureTextEntry={passwordHidden}
                placeholder="Enter Password"
                placeholderTextColor={Colors.GRAY}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableWithoutFeedback
                onPress={() => {
                  setPasswordHidden(!passwordHidden);
                }}
              >
                <Ionicons
                  name={passwordHidden ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={activeColors.text}
                  // onPress={()=> setPasswordHidden(!passwordHidden)}
                  style={{ shadowOpacity: 0 }}
                />
              </TouchableWithoutFeedback>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push("/auth/forgot")}
            style={{
              marginTop: 15,
              //left: 5,
              alignSelf: "flex-end",
            }}
          >
            <Text
              style={{
                color: activeColors.colorText,
              }}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {error ? (
            <Text style={{ color: "red", marginTop: 15 }}>{String(error)}</Text>
          ) : undefined}
          {/* Sign In Button */}
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              handleLogin();
            }}
            style={{
              padding: 15,
              backgroundColor: Colors.PRIMARY,
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
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Create Account Button */}
          <Text style={{ color: Colors.GRAY, marginTop: 15 }}>
            Don't have an account?
            <Text
              style={{ color: activeColors.colorText }}
              onPress={() => router.push("/auth/sign-up")}
            >
              {" "}
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
   
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    fontFamily: "dmsans",
  },
});
