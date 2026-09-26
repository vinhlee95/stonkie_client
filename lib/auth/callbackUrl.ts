export const DEFAULT_CALLBACK_URL = '/portfolio'

// Only same-origin absolute paths. Rejects protocol-relative (//x), backslash (/\x)
// and control chars (browsers strip tabs/newlines, turning /\t/x into //x).
export function sanitizeCallbackUrl(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return DEFAULT_CALLBACK_URL
  }

  if (/[\u0000-\u001f\u007f]/.test(value)) return DEFAULT_CALLBACK_URL
  return value
}
