import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RootStackParamList } from './navigation';
import type { RouteProp } from '@react-navigation/native';

// Typed navigation hook
export const useTypedNavigation = () => useNavigation<NavigationProp>();

// Typed route hook
export const useTypedRoute = <T extends keyof RootStackParamList>() => 
  useRoute<RouteProp<RootStackParamList, T>>();