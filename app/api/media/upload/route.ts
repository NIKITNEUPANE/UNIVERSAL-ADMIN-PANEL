import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateR2Key } from '@/lib/services/r2-client';

// Maximum allowed file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as 'products' | 'categories' | 'media') || 'media';
    const subfolder = (formData.get('subfolder') as string) || (formData.get('category') as string) || undefined;
    const colorName = (formData.get('color_name') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    // 1. Validate file size (10MB maximum)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 10MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
        },
        { status: 413 }
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file format (${file.type}). Supported formats: JPEG, PNG, WebP, AVIF, GIF, SVG.`,
        },
        { status: 415 }
      );
    }

    // 3. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Generate semantic R2 Key
    const key = generateR2Key(folder, file.name, subfolder);

    // 5. Upload to Cloudflare R2
    const metadata: Record<string, string> = {
      originalName: encodeURIComponent(file.name),
      uploadedAt: new Date().toISOString(),
    };
    if (colorName) {
      metadata.colorName = encodeURIComponent(colorName);
    }

    const uploadResult = await uploadToR2(buffer, key, file.type, metadata);

    return NextResponse.json({
      success: true,
      asset: {
        id: `r2-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        key: uploadResult.key,
        url: uploadResult.url,
        name: file.name,
        file_size: uploadResult.size,
        mime_type: file.type,
        category: subfolder || 'general',
        color_name: colorName,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Cloudflare R2 Upload Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file to Cloudflare R2',
      },
      { status: 500 }
    );
  }
}
