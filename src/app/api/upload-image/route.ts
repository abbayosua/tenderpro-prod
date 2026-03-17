import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Prepare form data for freeimage.host
    const formData = new FormData();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    formData.append('source', image); // base64 without prefix
    formData.append('format', 'json');

    // Upload to freeimage.host from server-side (no CORS restriction)
    const response = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.status_code === 200 && data.image?.url) {
      return NextResponse.json({
        success: true,
        url: data.image.url,
        thumbnail: data.image.thumb?.url,
        displayUrl: data.image.display_url,
        size: data.image.size,
      });
    } else {
      console.error('Freeimage.host error:', data);
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Failed to upload image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
