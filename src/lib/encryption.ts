import { createCipheriv, randomBytes } from 'crypto'

const KEY = process.env.PGCRYPTO_KEY
if (!KEY) {
  throw new Error('PGCRYPTO_KEY is required for encryption')
}

const KEY_BUFFER = Buffer.from(KEY, 'hex')

export function encryptValue(value: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', KEY_BUFFER, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}
