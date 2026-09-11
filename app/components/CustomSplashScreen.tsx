import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, Text, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Start timer immediately (1.5 s — short enough to not feel slow, long enough to
    // show branding while the auth state is being restored from storage)
    const timer = setTimeout(() => {
      onFinish();
    }, 1500);

    // Set ready to trigger any animations or just to ensure render
    setIsReady(true);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Orange Effect Background */}
        <View style={styles.orangeGlow} />

        {/* Logo */}
        <Image
          source={require('../../assets/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
          onLoad={() => console.log('Logo loaded')}
          onError={(e) => console.log('Logo error', e.nativeEvent.error)}
        />
      </View>

      {/* Loading indicator and text */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>

      {/* App name */}
      <Text style={styles.appName}>Adversity Trading</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008c99', // Brand teal — never looks blank/white
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.5,
    height: width * 0.5,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    zIndex: 2,
  },
  orangeGlow: {
    position: 'absolute',
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
    backgroundColor: 'rgba(255, 122, 0, 0.2)',
    zIndex: 1,
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  appName: {
    position: 'absolute',
    bottom: 50,
    fontSize: 18,
    fontWeight: '600',
    color: '#008c99',
  },
});

export default CustomSplashScreen;
