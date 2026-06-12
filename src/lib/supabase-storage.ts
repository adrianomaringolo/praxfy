import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Cliente Supabase sob demanda (service role — apenas server-side) */
export function getSupabase() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return client
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const supabase = getSupabase()
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await getSupabase().storage.from(bucket).remove([path])
  if (error) throw error
}
