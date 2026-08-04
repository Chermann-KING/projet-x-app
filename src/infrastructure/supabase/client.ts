import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string
  ?? process.env.EXPO_PUBLIC_SUPABASE_URL as string

const supabaseKey = Constants.expoConfig?.extra?.supabaseKey as string
  ?? process.env.EXPO_PUBLIC_SUPABASE_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables Supabase manquantes. Copiez .env.example vers .env et renseignez les valeurs.',
  )
}

/**
 * Client Supabase — singleton.
 * Usage réservé à src/infrastructure/supabase/ uniquement.
 * Ne jamais importer ce client hors de cette couche.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
