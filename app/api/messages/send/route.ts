import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

   const { recipientEmail, content } = await request.json()

if (!recipientEmail || !content) {
  return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
}

if (content.length > 2000) {
  return NextResponse.json({ error: 'Message too long. Max 2000 characters.' }, { status: 400 })
}

if (recipientEmail.length > 254) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
}
    if (!recipientEmail || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('email', recipientEmail)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: recipient.id,
        content_encrypted: content,
        status: 'pending'
      })
      .select()
      .single()

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}