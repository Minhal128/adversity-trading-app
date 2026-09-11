import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useNavigation, useFocusEffect, NavigationProp } from "@react-navigation/native";
import YoutubePlayer from "react-native-youtube-iframe";

const { width } = Dimensions.get("window");

// YouTube video ID extracted from: https://youtu.be/uKbKCx6wdHk
const YOUTUBE_VIDEO_ID = "uKbKCx6wdHk";

export default function AboutATCScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [playing, setPlaying] = useState(true);

  // Pause video when screen loses focus, play when it gains focus
  useFocusEffect(
    useCallback(() => {
      setPlaying(true);
      return () => {
        setPlaying(false);
      };
    }, [])
  );

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      // Loop the video when it ends
      setPlaying(false);
      setTimeout(() => setPlaying(true), 100);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About ATC</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Video container */}
      <View style={styles.videoContainer}>
        <View style={styles.videoWrapper}>
          <YoutubePlayer
            height={(width - 40) * (9 / 16)}
            width={width - 40}
            play={playing}
            videoId={YOUTUBE_VIDEO_ID}
            onChangeState={onStateChange}
            webViewProps={{
              allowsInlineMediaPlayback: true,
            }}
          />
        </View>
      </View>

      {/* Footer text */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Adversity Trading Circle</Text>
        <Text style={styles.footerSubtitle}>Transform Hardship By Bartering</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#008c99",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 70,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  videoWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  footerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  footerSubtitle: {
    color: "#E0E0E0",
    fontSize: 14,
  },
});
