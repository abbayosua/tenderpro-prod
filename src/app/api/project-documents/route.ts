import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Document type enum
const DOCUMENT_TYPES = ['CONTRACT', 'PROPOSAL', 'REPORT', 'CERTIFICATE', 'INVOICE', 'OTHER'] as const;
const DOCUMENT_STATUSES = ['APPROVED', 'REJECTED', 'PENDING'] as const;

// GET - Get documents for a project (Enhanced)
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const type = request.nextUrl.searchParams.get('type');
    const status = request.nextUrl.searchParams.get('status');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID wajib diisi' }, { status: 400 });
    }

    if (!db.projectDocument) {
      return NextResponse.json({ success: true, documents: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // Build where clause
    const where: Record<string, unknown> = { projectId };
    if (type && DOCUMENT_TYPES.includes(type as typeof DOCUMENT_TYPES[number])) {
      where.type = type;
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      db.projectDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: {
            select: { id: true, title: true },
          },
        },
      }),
      db.projectDocument.count({ where }),
    ]);

    // Enrich documents with uploader info and status
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        // Get uploader info
        const uploader = await db.user.findUnique({
          where: { id: doc.uploadedBy },
          select: { id: true, name: true, avatar: true },
        });

        // Determine status
        let docStatus = 'PENDING';
        if (doc.isApproved) {
          docStatus = 'APPROVED';
        } else if (doc.approvedBy && !doc.isApproved) {
          docStatus = 'REJECTED';
        }

        // Get version number (count documents with same name in this project)
        const versionCount = await db.projectDocument.count({
          where: {
            projectId: doc.projectId,
            name: { contains: doc.name.split('.')[0] },
            createdAt: { lte: doc.createdAt },
          },
        });

        return {
          id: doc.id,
          projectId: doc.projectId,
          projectTitle: doc.project?.title || null,
          uploadedBy: doc.uploadedBy,
          uploader: uploader ? {
            id: uploader.id,
            name: uploader.name,
            avatar: uploader.avatar,
          } : null,
          name: doc.name,
          type: doc.type,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          description: doc.description,
          status: docStatus,
          isApproved: doc.isApproved,
          approvedAt: doc.approvedAt?.toISOString() || null,
          approvedBy: doc.approvedBy,
          viewCount: doc.viewCount,
          downloadCount: doc.downloadCount,
          version: versionCount,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: enrichedDocuments,
      types: DOCUMENT_TYPES,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json({ success: true, documents: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } });
  }
}

// POST - Upload a document metadata (Enhanced)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, uploadedBy, name, type, fileUrl, fileSize, description } = body;

    if (!projectId || !uploadedBy || !name || !type || !fileUrl) {
      return NextResponse.json({ error: 'Data dokumen tidak lengkap' }, { status: 400 });
    }

    if (!DOCUMENT_TYPES.includes(type)) {
      return NextResponse.json({
        error: `Tipe dokumen tidak valid. Pilihan: ${DOCUMENT_TYPES.join(', ')}`,
      }, { status: 400 });
    }

    if (!db.projectDocument) {
      return NextResponse.json({ error: 'Fitur tidak tersedia' }, { status: 503 });
    }

    // Get version number for this document type/name
    const existingDocs = await db.projectDocument.count({
      where: { projectId, type },
    });

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

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        version: existingDocs + 1,
        status: 'PENDING',
        createdAt: document.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Gagal mengunggah dokumen' }, { status: 500 });
  }
}

// PUT - Update document status (Enhanced)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, status, approvedBy, description } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID wajib diisi' }, { status: 400 });
    }

    if (!db.projectDocument) {
      return NextResponse.json({ error: 'Fitur tidak tersedia' }, { status: 503 });
    }

    // Validate status
    if (status && !DOCUMENT_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `Status tidak valid. Pilihan: ${DOCUMENT_STATUSES.join(', ')}`,
      }, { status: 400 });
    }

    const existingDoc = await db.projectDocument.findUnique({
      where: { id: documentId },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status === 'APPROVED') {
      updateData.isApproved = true;
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy || null;
    } else if (status === 'REJECTED') {
      updateData.isApproved = false;
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy || null;
    } else if (status === 'PENDING') {
      updateData.isApproved = false;
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    const document = await db.projectDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        status: document.isApproved ? 'APPROVED' : (document.approvedBy ? 'REJECTED' : 'PENDING'),
      },
      message: status === 'APPROVED'
        ? 'Dokumen berhasil disetujui'
        : status === 'REJECTED'
        ? 'Dokumen ditolak'
        : 'Status dokumen diperbarui',
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Gagal memperbarui dokumen' }, { status: 500 });
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const documentId = request.nextUrl.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID wajib diisi' }, { status: 400 });
    }

    if (!db.projectDocument) {
      return NextResponse.json({ error: 'Fitur tidak tersedia' }, { status: 503 });
    }

    await db.projectDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Gagal menghapus dokumen' }, { status: 500 });
  }
}
