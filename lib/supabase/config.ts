const FALLBACK_SUPABASE_URL = "https://clajiztsabcgfmyubxdd.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_O8KeXVAsCerL_tsGdBkRPw_0DbLih9g";

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;
