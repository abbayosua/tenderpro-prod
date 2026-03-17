import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all documents for owner's projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all projects for this owner
    const projects = await db.project.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true },
    });

    const projectIds = projects.map(p => p.id);
    const projectMap = new Map(projects.map(p => [p.id, p.title]));

    if (projectIds.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    // Build where clause
    const where: Record<string, unknown> = { projectId: { in: projectIds } };
    if (type && type !== 'all') {
      where.type = type;
    }
    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }

    // Get documents
    const documents = await db.projectDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Format documents with project info
    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      projectId: doc.projectId,
      project: projectMap.get(doc.projectId) || 'Unknown Project',
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      description: doc.description,
      isApproved: doc.isApproved,
      approvedAt: doc.approvedAt,
      createdAt: doc.createdAt,
      viewCount: doc.viewCount || 0,
      downloadCount: doc.downloadCount || 0,
    }));

    return NextResponse.json({ documents: formattedDocs });
  } catch (error) {
    console.error('Error fetching owner documents:', error);
    return NextResponse.json({ documents: [] });
  }
}

// POST - Upload document to a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, uploadedBy, name, type, fileUrl, fileSize, description } = body;

    if (!projectId || !uploadedBy || !name || !type || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, ownerId: uploadedBy },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
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
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const documentId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!documentId || !userId) {
      return NextResponse.json({ error: 'Document ID and User ID required' }, { status: 400 });
    }

    // Verify ownership through project
    const doc = await db.projectDocument.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!doc || doc.project.ownerId !== userId) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 403 });
    }

    await db.projectDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
