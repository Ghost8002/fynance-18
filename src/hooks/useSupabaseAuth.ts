
// This file creates a compatibility layer for the old useSupabaseAuth import
// All components can continue using useSupabaseAuth but it will use the new consolidated useAuth hook
export { useAuth as useSupabaseAuth } from './useAuth';
