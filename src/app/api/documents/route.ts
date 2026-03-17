import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const documents = await db.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, name, fileUrl } = body;

    const document = await db.document.create({
      data: {
        userId,
        type,
        name,
        fileUrl,
        verified: false,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, verified, notes } = body;

    const document = await db.document.update({
      where: { id: documentId },
      data: {
        verified,
        notes,
        verifiedAt: verified ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
