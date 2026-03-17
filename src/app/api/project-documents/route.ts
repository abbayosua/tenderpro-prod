import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get documents for a project
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const type = request.nextUrl.searchParams.get('type');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Check if projectDocument model exists
    if (!db.projectDocument) {
      return NextResponse.json({ documents: [] });
    }

    const where: Record<string, unknown> = { projectId };
    if (type) {
      where.type = type;
    }

    const documents = await db.projectDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json({ documents: [] });
  }
}

// POST - Upload a document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, uploadedBy, name, type, fileUrl, fileSize, description } = body;

    if (!projectId || !uploadedBy || !name || !type || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if projectDocument model exists
    if (!db.projectDocument) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const document = await db.projectDocument.create({
      data: {
        projectId,
        uploadedBy,
        name,
        type,
        fileUrl,
        fileSize: fileSize || 0,
        description,
      }
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

// PUT - Approve/reject document
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, isApproved, approvedBy } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Check if projectDocument model exists
    if (!db.projectDocument) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const updateData: Record<string, unknown> = { 
      isApproved,
      approvedAt: isApproved ? new Date() : null,
      approvedBy: isApproved ? approvedBy : null
    };

    const document = await db.projectDocument.update({
      where: { id: documentId },
      data: updateData
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const documentId = request.nextUrl.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Check if projectDocument model exists
    if (!db.projectDocument) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    await db.projectDocument.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
