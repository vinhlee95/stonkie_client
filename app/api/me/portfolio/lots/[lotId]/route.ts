import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend } from '../../proxy'

type Context = { params: Promise<{ lotId: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function lotPath(context: Context): Promise<string | null> {
  const id = (await context.params).lotId
  return UUID_RE.test(id) ? `/api/me/portfolio/lots/${id.toLowerCase()}` : null
}

export async function PATCH(req: NextRequest, context: Context) {
  const path = await lotPath(context)
  if (!path) return NextResponse.json({ error: 'Invalid lot id' }, { status: 400 })
  return proxyToBackend(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: await req.text(),
  })
}

export async function DELETE(_req: NextRequest, context: Context) {
  const path = await lotPath(context)
  if (!path) return NextResponse.json({ error: 'Invalid lot id' }, { status: 400 })
  return proxyToBackend(path, { method: 'DELETE' })
}
