import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import userApi from "../../services/userApi";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      Alert.alert("Error", "Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await userApi.logout();
              await logout();
              navigation.navigate("SignIn");
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008C99" />
      </View>
    );
  }

  // Calculate rating (placeholder - you can connect to real data)
  const rating = user?.rating || 4.5;
  const trades = user?.trades?.length || 0;
  const credits = user?.credits || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Feather name="settings" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: user?.profileImage?.url || "https://randomuser.me/api/portraits/men/1.jpg" }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.name || "User"}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#008C99" />
            <Text style={styles.locationText}>{user?.location || "Location"}</Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("Editprofile")}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate("FriendsList")}>
            <Text style={styles.statNumber}>{user?.friends?.length || 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trades}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{credits}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{rating}</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(rating) ? "star" : star - 0.5 <= rating ? "star-half" : "star-outline"}
                  size={10}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* My Friends Card */}
        <TouchableOpacity
          style={styles.friendsCard}
          onPress={() => navigation.navigate("FriendsList")}
        >
          <View style={styles.friendsCardContent}>
            <View style={styles.friendsIconContainer}>
              <Ionicons name="people" size={24} color="#008C99" />
            </View>
            <View style={styles.friendsTextContainer}>
              <Text style={styles.friendsTitle}>My Friends</Text>
              <Text style={styles.friendsSubtitle}>
                {user?.friends?.length || 0} friends • Tap to view and propose barters
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        {/* Skills Offered Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills Offered</Text>
          <View style={styles.tagsContainer}>
            {user?.skills && user.skills.length > 0 ? (
              user.skills.map((item, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No skills added yet</Text>
            )}
          </View>
        </View>

        {/* Skills Seeking Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills/Services Seeking</Text>
          <View style={styles.tagsContainer}>
            {user?.serviceSeeking ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{user.serviceSeeking}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No services specified</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Tab */}
      <View style={styles.bottomTab}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ActiveTrades")}>
          <Ionicons name="swap-horizontal-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Chats")}>
          <Ionicons name="chatbubbles-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#008C99',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 12,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#008C99',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#FFF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  ratingStars: {
    flexDirection: 'row',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: '#555',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
  friendsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
      },
    }),
    borderWidth: 1,
    borderColor: '#008C99',
  },
  friendsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  friendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bottomTab: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#008C99',
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.3)',
      },
    }),
  },
});
