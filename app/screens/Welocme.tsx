import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, NavigationProp, CommonActions } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function GetStartedScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user, token, loading } = useAuth();

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user && token) {
      console.log('✅ User already authenticated, redirecting to Home');
      // Reset navigation stack to Home to prevent going back to GetStarted
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    }
  }, [user, token, loading, navigation]);

  // Show branded loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#008c99' }}>
        <Image
          source={require("../../assets/logo1.png")}
          style={{ width: 100, height: 100, marginBottom: 20 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ marginTop: 16, color: '#ffffff', fontSize: 16 }}>Loading...</Text>
        <Text style={{ marginTop: 8, color: '#FFE0B2', fontSize: 14, fontWeight: '500' }}>Adversity Trading</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Top teal section */}
      <View style={styles.topSection}>
        <Image
          source={require("../../assets/logo1.png")}
          style={styles.logo} // Smaller logo using CSS
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.titleText}>
          Adversity Trading Circle
        </Text>
        <Text style={styles.subtitleText}>
          Transform Hardship By Bartering
        </Text>
      </View>

      {/* Bottom white section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={() => navigation.navigate("SignUp")}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("SignIn")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("AboutATC")}
          style={styles.aboutButton}
        >
          <Text style={styles.aboutButtonText}>About ATC</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Trade your{" "}
          <Text style={styles.orangeText}>skills and time</Text>{" "}
          for{" "}
          <Text style={styles.orangeText}>goods and services.</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008c99',
  },
  topSection: {
    backgroundColor: '#008c99',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logo: {
    width: 80,  // Much smaller logo
    height: 80, // Much smaller logo
    marginBottom: 10,
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  titleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: '#E0E0E0',
    fontSize: 12,
    marginTop: 6,
  },
  bottomSection: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#FF7A00',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 12,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginTop: 16,
  },
  secondaryButtonText: {
    color: 'black',
    fontWeight: '500',
    fontSize: 16,
  },
  aboutButton: {
    backgroundColor: '#008c99',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginTop: 16,
  },
  aboutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 40,
    width: '80%',
  },
  orangeText: {
    color: '#FF7A00',
    fontWeight: '600',
  },
});