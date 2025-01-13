import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const publicDb = "https://idfhmyixlkqlkgvneqoe.supabase.co";
const publicKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZmhteWl4bGtxbGtndm5lcW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTk0MjQsImV4cCI6MjA1MjI5NTQyNH0.xd43Ks_W8nM_v-IuaIHG7rnAMs5n4kb4IqWIDhEuOAI";

export const supabase = createClient<Database>(publicDb, publicKey);
