import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oadlovhvqzlkxirzyjcb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZGxvdmh2cXpsa3hpcnp5amNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTMzMDksImV4cCI6MjA2Mzg2OTMwOX0.QL55RPxsyqEmD7WmkWoy6j_LZaDSXyWEzdPiGej1Hmw';

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.info("Supabase client initialized successfully.");
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
} else {
  console.warn(
    "Supabase URL or Anon Key is missing. " +
    "Supabase features will be unavailable until configured."
  );
}

export { supabase };