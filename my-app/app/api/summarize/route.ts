import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'No document ID provided' }, { status: 400 });
    }

    // Get document from database
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (dbError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.extracted_text) {
      return NextResponse.json({ error: 'No extracted text found. Please extract text first.' }, { status: 400 });
    }

    // Call GitHub Models API (GPT-4.1-mini)
    const response = await fetch(
      'https://models.inference.ai.azure.com/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes documents clearly and concisely.',
            },
            {
              role: 'user',
              content: `Please summarize the following document in 3-5 sentences:\n\n${document.extracted_text}`,
            },
          ],
          max_tokens: 500,
        }),
      }
    );

    const aiData = await response.json();
    const summary = aiData.choices?.[0]?.message?.content;

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    // Save summary to database
    await supabaseAdmin
      .from('documents')
      .update({ summary })
      .eq('id', documentId);

    return NextResponse.json({ success: true, summary });

  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}