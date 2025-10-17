import { AbstractSubmission } from '../types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const escapePdfText = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapSummary = (summary: string, lineLength = 72): string[] => {
  const words = summary.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if (!currentLine.length) {
      currentLine = word;
      return;
    }

    if (`${currentLine} ${word}`.length > lineLength) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = `${currentLine} ${word}`;
    }
  });

  if (currentLine.length) {
    lines.push(currentLine);
  }

  return lines;
};

const buildTextStream = (lines: string[]): string => {
  const commands: string[] = ['BT', '/F1 20 Tf', '72 760 Td'];
  const lineSpacing = 24;

  if (lines.length === 0) {
    commands.push('(Empty) Tj', 'ET');
    return commands.join('\n');
  }

  const [firstLine, ...rest] = lines;
  commands.push(`(${escapePdfText(firstLine)}) Tj`, '/F1 14 Tf');

  rest.forEach((line) => {
    commands.push(`0 -${lineSpacing} Td`, `(${escapePdfText(line)}) Tj`);
  });

  commands.push('ET');
  return commands.join('\n');
};

const buildPdfFromStreams = (streams: string[]): Uint8Array => {
  if (!streams.length) {
    throw new Error('No pages to include in PDF.');
  }

  const objects: { id: number; body: string }[] = [];
  const addObject = (body: string) => {
    const id = objects.length + 1;
    objects.push({ id, body });
    return id;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>'); // 1 0 obj
  const pagesObjectIndex = addObject(''); // placeholder for 2 0 obj
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const pageIds: number[] = [];

  streams.forEach((stream) => {
    const streamBytes = textEncoder.encode(stream);
    const contentBody = `<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`;
    const contentId = addObject(contentBody);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesObjectIndex} 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
    pageIds.push(pageId);
  });

  objects[pagesObjectIndex - 1].body = `<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  let offset = pdf.length;
  const xrefEntries: string[] = ['0000000000 65535 f '];

  objects.forEach((obj) => {
    const objectString = `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
    xrefEntries.push(`${offset.toString().padStart(10, '0')} 00000 n `);
    pdf += objectString;
    offset += objectString.length;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += xrefEntries.map((entry) => `${entry}\n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return textEncoder.encode(pdf);
};

const extractContentStream = (pdfBytes: Uint8Array): string => {
  const source = textDecoder.decode(pdfBytes);
  const match = source.match(/stream\s*([\s\S]*?)\s*endstream/);

  if (!match) {
    throw new Error('Abstract PDF did not contain a content stream.');
  }

  return match[1].trim();
};

export const generateAbstractPdf = (submission: AbstractSubmission): Uint8Array => {
  const summaryLines = wrapSummary(submission.summary);
  const lines = [
    `${submission.order}. ${submission.title}`,
    `Presenter: ${submission.presenter}`,
    '',
    ...summaryLines,
  ];

  const stream = buildTextStream(lines);
  return buildPdfFromStreams([stream]);
};

export const mergeAbstractPdfs = (pdfs: Uint8Array[]): Uint8Array => {
  if (!pdfs.length) {
    throw new Error('No abstract PDFs supplied.');
  }

  const streams = pdfs.map(extractContentStream);
  return buildPdfFromStreams(streams);
};
