import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and TXT files are allowed' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
    .from('documents')
    .upload(fileName, buffer, { 
        contentType: file.type,
        duplex: 'half'
    });

    if (uploadError) throw uploadError;

    // Save metadata to database
    const { data, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        filename: file.name,
        file_path: fileName,
        file_type: file.type,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, document: data });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}