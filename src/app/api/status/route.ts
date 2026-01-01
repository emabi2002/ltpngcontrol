import { NextResponse } from 'next/server';
import { getEnvStatus, isSupabaseConfigured, isManagementApiConfigured } from '@/lib/supabase';

export async function GET() {
  const envStatus = getEnvStatus();

  return NextResponse.json({
    success: true,
    configured: isSupabaseConfigured(),
    managementApiConfigured: isManagementApiConfigured(),
    environment: {
      supabaseUrl: envStatus.supabaseUrl,
      supabaseAnonKey: envStatus.supabaseAnonKey,
      supabaseServiceKey: envStatus.supabaseServiceKey,
      supabaseAccessToken: envStatus.supabaseAccessToken,
    },
    requiredEnvVars: [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', configured: envStatus.supabaseUrl, required: true },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', configured: envStatus.supabaseAnonKey, required: true },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', configured: envStatus.supabaseServiceKey, required: false },
      { name: 'SUPABASE_ACCESS_TOKEN', configured: envStatus.supabaseAccessToken, required: false },
    ],
  });
}
