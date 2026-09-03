import { NextRequest, NextResponse } from 'next/server';
import { listR2Objects, R2_CONFIG } from '@/lib/services/r2-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;
    const category = searchParams.get('category') || undefined;

    const effectivePrefix = category && category !== 'all' ? `media/${category}` : prefix;

    const r2Items = await listR2Objects(effectivePrefix, 200);

    const assets = r2Items.map((item) => {
      // Parse key parts: e.g. "media/apparel/1725367890-uuid-filename.jpg"
      const parts = item.key.split('/');
      const filename = parts[parts.length - 1] || item.key;
      const detectedCategory = parts.length > 2 ? parts[1] : 'general';

      return {
        id: `r2-${item.key.replace(/[^a-zA-Z0-9-]/g, '-')}`,
        key: item.key,
        name: filename.replace(/^\d+-[a-z0-9]+-/, ''), // Strip prefix timestamps
        url: item.url,
        category: detectedCategory,
        tags: [detectedCategory, ...filename.split(/[-_.]/).filter((t) => t.length > 2)],
        file_size: item.size,
        created_at: item.lastModified ? item.lastModified.toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      bucket: R2_CONFIG.bucketName,
      publicDomain: R2_CONFIG.publicDomain,
      count: assets.length,
      assets,
    });
  } catch (error: any) {
    console.error('[Cloudflare R2 List Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list objects from Cloudflare R2',
      },
      { status: 500 }
    );
  }
}
