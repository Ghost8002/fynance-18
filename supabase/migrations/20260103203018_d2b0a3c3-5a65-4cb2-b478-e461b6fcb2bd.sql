-- Fix security issues for accounts, user_profiles, and ai_chat_history tables
-- Ensure RLS is properly enabled and policies are correctly restrictive

-- 1. Ensure RLS is enabled (should already be, but confirming)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS for table owners (prevents bypassing RLS even for table owners)
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history FORCE ROW LEVEL SECURITY;

-- 3. Revoke public access from anon role to ensure no unauthorized access
REVOKE ALL ON public.accounts FROM anon;
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.ai_chat_history FROM anon;

-- 4. Grant access only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_history TO authenticated;