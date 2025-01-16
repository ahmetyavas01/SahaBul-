import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://qqmwpqmfrxpsrhsievlp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXdwcW1mcnhwc3Joc2lldmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5ODQyMzQsImV4cCI6MjA1MjU2MDIzNH0.ecFn2cjbzr-g3reDmnckv53zkkXIJr61LCMkp2ynDIc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 