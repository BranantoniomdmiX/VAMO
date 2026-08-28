import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '8744543e820765bfe2f3a01daecd213e'
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '3712bf44fcf4bff1c3b04941c4546fe9'
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '61f1ce9b52e0a977ba9ba19340e2a772568a2cd54d3e58f96e27ba3098a520dc'
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'vamo-assets'
const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'https://pub-346e104dce064f78bcd45e949decf897.r2.dev'

// Cliente S3 configurado para Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Obtener la URL pública CDN de un archivo almacenado en Cloudflare R2
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key
  return `${R2_PUBLIC_DOMAIN}/${cleanKey}`
}

/**
 * Subir un buffer o Blob directamente a Cloudflare R2
 */
export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<{ key: string; publicUrl: string }> {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    Body: fileBuffer,
    ContentType: contentType,
  })

  await r2Client.send(command)

  return {
    key: cleanKey,
    publicUrl: getR2PublicUrl(cleanKey),
  }
}

/**
 * Generar una URL prefirmada para que el frontend suba fotos pesadas directamente a R2 sin saturar el backend
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string = 'image/jpeg',
  expiresInSeconds: number = 300
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds })

  return {
    uploadUrl,
    publicUrl: getR2PublicUrl(cleanKey),
    key: cleanKey,
  }
}

/**
 * Eliminar un archivo de Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    })
    await r2Client.send(command)
    return true
  } catch (err) {
    console.error('Error eliminando archivo de Cloudflare R2:', err)
    return false
  }
}
