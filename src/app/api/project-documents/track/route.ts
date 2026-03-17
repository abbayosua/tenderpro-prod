import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Track document view/download
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, action } = body; // action: 'view' | 'download'

    if (!documentId || !action) {
      return NextResponse.json({ error: 'Document ID and action required' }, { status: 400 });
    }

    // Get current document to verify it exists
    const document = await db.projectDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Increment the appropriate counter
    const updateData = action === 'view'
      ? { viewCount: { increment: 1 } }
      : { downloadCount: { increment: 1 } };

    const updatedDocument = await db.projectDocument.update({
      where: { id: documentId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      viewCount: updatedDocument.viewCount,
      downloadCount: updatedDocument.downloadCount,
      fileUrl: document.fileUrl // Return file URL for download action
    });
  } catch (error) {
    console.error('Error tracking document:', error);
    return NextResponse.json({ error: 'Failed to track document' }, { status: 500 });
  }
}

// GET - Get document with tracking info
export async function GET(request: NextRequest) {
  try {
    const documentId = request.nextUrl.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const document = await db.projectDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Increment view count when fetching document details
    const updatedDocument = await db.projectDocument.update({
      where: { id: documentId },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json({
      document: {
        ...document,
        viewCount: updatedDocument.viewCount
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}
