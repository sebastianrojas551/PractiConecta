export type Role = 'estudiante' | 'empresa'
export type Account = { email: string; role: Role }
export type Profile = Record<string, string | number | null>

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function api<T>(path: string, method = 'GET', body?: object): Promise<T> {
  let response: Response
  try {
    response = await fetch('/api' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No pudimos conectar con PractiConecta. Intenta nuevamente.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = typeof data?.detail === 'string' ? data.detail : 'Ocurrió un error. Intenta nuevamente.'
    throw new ApiError(response.status, message)
  }
  return response.status === 204 ? undefined as T : response.json()
}
