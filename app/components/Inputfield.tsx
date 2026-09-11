// components/InputField.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface InputFieldProps extends TextInputProps {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

const InputField = ({ 
  label, 
  placeholder, 
  secureTextEntry = false, 
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
  ...props 
}: InputFieldProps) => {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-sm font-medium mb-2">{label}</Text>
      <View className="relative">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          style={{ color: '#000000' }}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            className="absolute right-3 top-3"
            onPress={onTogglePassword}
          >
            <Ionicons
              name={secureTextEntry ? "eye" : "eye-off"}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

InputField.displayName = 'InputField';

export default InputField;