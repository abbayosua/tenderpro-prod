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

    const verificationRequests = await db.verificationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ verificationRequests });
  } catch (error) {
    console.error('Get verification requests error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Check if there's a pending verification request
    const existingRequest = await db.verificationRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki permintaan verifikasi yang sedang diproses' },
        { status: 400 }
      );
    }

    // Check if user has uploaded documents
    const documents = await db.document.findMany({
      where: { userId },
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'Mohon unggah dokumen terlebih dahulu' },
        { status: 400 }
      );
    }

    const verificationRequest = await db.verificationRequest.create({
      data: {
        userId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, verificationRequest });
  } catch (error) {
    console.error('Create verification request error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
