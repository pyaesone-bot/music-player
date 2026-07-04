import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Schedule } from '../types';

const SCHEDULES_KEY = '@mp/schedules';

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULES_KEY);
    return raw ? (JSON.parse(raw) as Schedule[]) : [];
  } catch {
    return [];
  }
}

export async function saveSchedules(schedules: Schedule[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}
