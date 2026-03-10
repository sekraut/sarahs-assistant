// Supabase Configuration — Sarah's Assistant
const SUPABASE_URL = 'https://vtflffpvetugzvrrrotr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZmxmZnB2ZXR1Z3p2cnJyb3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzU2ODUsImV4cCI6MjA4ODc1MTY4NX0.KkUosOXmHnYpfevrdJhxfs3gs4CrNxQw48GVJycbvG4';

// Initialize Supabase client
const supabase = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Storage helpers
const STORAGE = {
    documents: {
        bucket: 'documents',
        // Private bucket — get signed URLs for access
    },
    attachments: {
        bucket: 'attachments',
        // Private bucket — message attachments
    },
};
