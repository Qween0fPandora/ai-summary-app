import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'No document ID provided' }, { status: 400 });
    }

    // Get document metadata from database
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (dbError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) throw downloadError;

    // Extract text based on file type
    let extractedText = '';

    if (document.file_type === 'text/plain') {
      extractedText = await fileData.text();
      console.log('Extracted text:', extractedText);
    } else if (document.file_type === 'application/pdf') {
      extractedText = '[PDF text extraction requires additional setup]';
    }

    // Save extracted text to database
    await supabaseAdmin
      .from('documents')
      .update({ extracted_text: extractedText })
      .eq('id', documentId);

    return NextResponse.json({ success: true, extractedText });

  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}