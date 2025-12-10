import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuvaafsgwbyztrykcqvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmFhZnNnd2J5enRyeWtjcXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzUxNjAsImV4cCI6MjA4MDk1MTE2MH0.lb0SE6mTOt7gfIu2wKmmzLzzzAr0VQ2ehAXUy4mmS2s';

export const supabase = createClient(supabaseUrl, supabaseKey);