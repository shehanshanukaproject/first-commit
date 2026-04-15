import { auth } from '@clerk/nextjs/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { fileName } = await request.json()
    if (!fileName) return Response.json({ error: 'fileName required' }, { status: 400 })

    const supabase  = getSupabaseServer()
    // Sanitise filename and prefix with userId so paths never collide
    const safeName  = fileName.replace(/[^a-zA-Z0-9._\-]/g, '_')
    const filePath  = `${userId}/${Date.now()}-${safeName}`

    const { data, error } = await supabase.storage
      .from('lecture-uploads')
      .createSignedUploadUrl(filePath)

    if (error) {
      return Response.json(
        { error: 'Could not create upload URL — make sure the "lecture-uploads" bucket exists in Supabase Storage.' },
        { status: 500 }
      )
    }

    return Response.json({ signedUrl: data.signedUrl, token: data.token, path: filePath })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
