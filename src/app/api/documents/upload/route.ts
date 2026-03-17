import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Freeimage.host API key
const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base64Image, name, type, projectId, userId } = body;

    if (!base64Image || !name || !type || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, ownerId: userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyek tidak ditemukan atau akses ditolak' },
        { status: 403 }
      );
    }

    // Upload to freeimage.host
    const formData = new FormData();
    formData.append('key', FREEIMAGE_API_KEY);
    formData.append('source', base64Image);
    formData.append('format', 'json');

    const uploadResponse = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    if (uploadData.status_code !== 200 || !uploadData.image?.url) {
      console.error('Freeimage upload error:', uploadData);
      return NextResponse.json(
        { error: uploadData.error?.message || 'Gagal mengunggah gambar ke server' },
        { status: 500 }
      );
    }

    const imageUrl = uploadData.image.url;
    const fileSize = uploadData.image.size || 0;

    // Save document to database
    const document = await db.projectDocument.create({
      data: {
        projectId,
        uploadedBy: userId,
        name,
        type,
        fileUrl: imageUrl,
        fileSize,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        projectId: document.projectId,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengunggah dokumen' },
      { status: 500 }
    );
  }
}
