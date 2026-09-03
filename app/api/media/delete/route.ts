import { NextRequest, NextResponse } from 'next/server';
import { deleteFromR2 } from '@/lib/services/r2-client';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let key = searchParams.get('key');

    if (!key) {
      try {
        const body = await request.json();
        key = body.key;
      } catch {
        // No body provided
      }
    }

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'No object key provided for deletion' },
        { status: 400 }
      );
    }

    await deleteFromR2(key);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted object '${key}' from Cloudflare R2`,
      key,
    });
  } catch (error: any) {
    console.error('[Cloudflare R2 Delete Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete object from Cloudflare R2',
      },
      { status: 500 }
    );
  }
}

// Support POST with action for environments where DELETE method is restricted
export async function POST(request: NextRequest) {
  return DELETE(request);
}
