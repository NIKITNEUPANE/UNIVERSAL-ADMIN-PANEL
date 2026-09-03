import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

// Cloudflare R2 Configuration
export const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || 'ab94ca7fe2714291ff48ec76111769e3',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || 'c56bf695766e430f56cf45b407a887d7',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '45acbe31ba6b7d4bd45474810abe8f50dc3f25f92e6669cf2e9b315e42da2293',
  bucketName: process.env.R2_BUCKET_NAME || 'littledreamersclub',
  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID || 'ab94ca7fe2714291ff48ec76111769e3'}.r2.cloudflarestorage.com`,
  publicDomain: (
    process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'https://littlemedia.tantriktech.com.np'
  ).replace(/\/$/, ''),
};

/**
 * Singleton S3Client instance for Cloudflare R2
 */
let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
      },
    });
  }
  return r2ClientInstance;
}

/**
 * Formats a key into its canonical public CDN URL
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  return `${R2_CONFIG.publicDomain}/${cleanKey}`;
}

/**
 * Uploads a buffer directly to Cloudflare R2
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ url: string; key: string; size: number }> {
  const client = getR2Client();
  const cleanKey = key.replace(/^\/+/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  return {
    url: getR2PublicUrl(cleanKey),
    key: cleanKey,
    size: buffer.length,
  };
}

/**
 * Deletes an object from Cloudflare R2 by key
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  const cleanKey = key.replace(/^\/+/, '');

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: cleanKey,
    })
  );

  return true;
}

/**
 * Lists objects from Cloudflare R2
 */
export async function listR2Objects(
  prefix?: string,
  maxKeys: number = 100
): Promise<Array<{ key: string; size: number; lastModified?: Date; url: string }>> {
  const client = getR2Client();
  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix ? prefix.replace(/^\/+/, '') : undefined,
      MaxKeys: maxKeys,
    })
  );

  if (!res.Contents || res.Contents.length === 0) {
    return [];
  }

  return res.Contents.filter((item) => item.Key && !item.Key.endsWith('/')).map((item) => ({
    key: item.Key!,
    size: item.Size || 0,
    lastModified: item.LastModified,
    url: getR2PublicUrl(item.Key!),
  }));
}

/**
 * Checks if an object exists in Cloudflare R2
 */
export async function checkR2ObjectExists(key: string): Promise<boolean> {
  const client = getR2Client();
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: key.replace(/^\/+/, ''),
      })
    );
    return true;
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * Generates an organized, semantic Cloudflare R2 object key
 */
export function generateR2Key(
  folder: 'products' | 'categories' | 'media',
  filename: string,
  subfolder?: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);

  // Sanitize filename: lowercase, replace spaces/special chars with hyphens
  const cleanName = filename
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (folder === 'products') {
    const contextPrefix = subfolder ? `${subfolder.replace(/[^a-z0-9-]+/g, '-')}-` : '';
    return `products/${year}/${month}/${contextPrefix}${timestamp}-${cleanName}`;
  }

  if (folder === 'categories') {
    const categoryPrefix = subfolder ? `${subfolder.replace(/[^a-z0-9-]+/g, '-')}-` : '';
    return `categories/${categoryPrefix}${timestamp}-${cleanName}`;
  }

  // General media library
  const categoryFolder = (subfolder || 'general').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return `media/${categoryFolder}/${timestamp}-${random}-${cleanName}`;
}
