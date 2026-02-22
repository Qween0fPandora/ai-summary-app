'use client'

import { useState } from "react";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  extracted_text?: string;
  summary?: string;
  created_at: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [message, setMessage] = useState('');

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      setDocument(data.document);
      setMessage('File uploaded successfully!');
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setUploading(false);
  }

  async function handleExtract() {
    if (!document) return;
    setExtracting(true);
    setMessage('Extracting text...');

    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: document.id }),
    });
    const data = await res.json();

    if (data.success) {
      setDocument(prev => prev ? { ...prev, extracted_text: data.extractedText } : null);
      setMessage('Text extracted successfully!');
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setExtracting(false);
  }

  async function handleSummarize() {
    if (!document) return;
    setSummarizing(true);
    setMessage('Generating AI summary...');

    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: document.id }),
    });
    const data = await res.json();

    if (data.success) {
      setDocument(prev => prev ? { ...prev, summary: data.summary } : null);
      setMessage('Summary generated successfully!');
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setSummarizing(false);
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 800 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1d324b' }}>
        AI Summary App
      </h1>

      {/* Upload Section */}
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 12 }}>Upload Document</h2>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 12, display: 'block' }}
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <p style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 8, color: '#0369a1' }}>
          {message}
        </p>
      )}

      {/* Document Actions */}
      {document && (
        <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 8 }}>
            {document.filename}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {extracting ? 'Extracting...' : 'Extract Text'}
            </button>
            <button
              onClick={handleSummarize}
              disabled={summarizing || !document.extracted_text}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {summarizing ? 'Summarizing...' : 'Generate Summary'}
            </button>
          </div>

          {/* Extracted Text */}
          {document.extracted_text && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: 4 }}>Extracted Text:</h3>
              <p style={{ padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                {document.extracted_text}
              </p>
            </div>
          )}

          {/* Summary */}
          {document.summary && (
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: 4 }}>AI Summary:</h3>
              <p style={{ padding: 12, backgroundColor: '#fefce8', borderRadius: 8 }}>
                {document.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}