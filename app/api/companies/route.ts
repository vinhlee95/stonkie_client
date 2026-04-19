import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/companies/most-viewed`, {
      next: { revalidate: 60, tags: ['most-viewed-companies'] },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 502 })
    }

    const json = await response.json()
    return NextResponse.json(json.data ?? json)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 502 })
  }
}
