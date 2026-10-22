import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';

export async function parseDocumentFile(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (err) {
      console.error('Error parsing PDF:', err);
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  } else if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      console.error('Error parsing DOCX:', err);
      throw new Error(`Failed to parse DOCX document: ${err.message}`);
    }
  } else if (ext === '.txt' || ext === '.md' || ext === '.csv') {
    return buffer.toString('utf-8');
  } else {
    // Attempt fallback utf-8 read
    return buffer.toString('utf-8');
  }
}
