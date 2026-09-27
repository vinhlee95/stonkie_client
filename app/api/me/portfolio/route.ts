import { proxyToBackend } from './proxy'

export async function GET() {
  return proxyToBackend('/api/me/portfolio')
}
