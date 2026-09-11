import React, { useState, useRef } from "react";
import { View, Text, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ConfettiCannon from "react-native-confetti-cannon";
import barterApi from "../../services/barterApi";

export default function RatingScreen() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { trade, barterId, userName, userImage } = (route.params as any) || {};
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const confettiRef = useRef(null);

  

 const handleSubmit = async () => {
  if (rating === 0) {
    Alert.alert("Error", "Please select a star rating before submitting.");
    return;
  }
  if (review.trim() === "") {
    Alert.alert("Error", "Please write a review before submitting.");
    return;
  }

  try {
    setSubmitting(true);

    // Submit rating to backend
    if (barterId) {
      await barterApi.completeBarter({
        barterId,
        rating,
        comment: review.trim(),
      } as any);
    }

    // Show confetti
    setShowConfetti(true);

    // Hide confetti and reset input after 3 seconds
    setTimeout(() => {
      setShowConfetti(false);
      setRating(0);
      setReview("");
      navigation.goBack();
    }, 3000);

    Alert.alert("Thank you!", `Your ${rating}-star review has been submitted.`);
  } catch (error: any) {
    Alert.alert("Error", error.message || "Failed to submit review");
  } finally {
    setSubmitting(false);
  }
};


  return (
    <View className="flex-1 bg-[#C7F3F5] px-5 pt-12 pb-24">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-3">Write a Review to {userName || trade?.name || "User"}</Text>
      </View>

      {/* Profile Image */}
      <View className="items-center">
        <Image
          source={{ uri: userImage || trade?.image || "https://randomuser.me/api/portraits/men/32.jpg" }}
          className="w-20 h-20 rounded-full mb-3"
        />
      </View>

      {/* Review Input */}
      <View className="bg-white rounded-2xl p-4 shadow mb-4">
        <TextInput
          placeholder="Write your Review..."
          multiline
          value={review}
          onChangeText={setReview}
          className="text-gray-700 min-h-[100px]"
        />
      </View>

      {/* Rating Section */}
      <Text className="text-gray-700 font-semibold mb-2">Give your Ratings</Text>
      <View className="flex-row justify-between mx-8 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i)}>
            <Ionicons
              name={i <= rating ? "star" : "star-outline"}
              size={32}
              color={i <= rating ? "#FFA500" : "gray"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className="bg-orange-500 py-3 rounded-2xl"
        onPress={handleSubmit}
      >
        <Text className="text-center text-white font-semibold text-lg">
          Submit
        </Text>
      </TouchableOpacity>

      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiCannon
          count={80}
          origin={{ x: 200, y: 0 }}
          fadeOut={true}
          autoStart={true}
          explosionSpeed={300}
          fallSpeed={2500}
          ref={confettiRef}
        />
      )}
    </View>
  );
}
