import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { AuthUser } from '@/types/auth';

const KEY = 'hueso_time_auth_user_v1';

async function setItem(value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

async function getItem() {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

async function deleteItem() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}

export async function loadAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await getItem();
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function saveAuthUser(user: AuthUser) {
  await setItem(JSON.stringify(user));
}

export async function clearAuthUser() {
  await deleteItem();
}
