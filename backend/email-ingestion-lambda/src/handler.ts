import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ParsedMail, simpleParser } from 'mailparser';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { Blob } from 'buffer';

const s3 = new S3Client({});
const sqs = new SQSClient({});

const queueUrl = process.env.EMAIL_FIFO_QUEUE_URL;
const defaultMessageGroupId = process.env.EMAIL_FIFO_MESSAGE_GROUP_ID ?? 'email-ingestion';

if (!queueUrl) {
  throw new Error('EMAIL_FIFO_QUEUE_URL environment variable is required');
}

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Email ingestion handler started', {
    recordCount: event.Records.length,
    queueUrl,
    timestamp: new Date().toISOString(),
  });

  const results = await Promise.all(event.Records.map(processRecord));

  const failures = results.filter((result) => result instanceof Error) as Error[];
  if (failures.length) {
    console.error('Email ingestion handler completed with failures', {
      totalRecords: event.Records.length,
      failureCount: failures.length,
      successCount: event.Records.length - failures.length,
      timestamp: new Date().toISOString(),
    });
    const error = new Error(`Failed to process ${failures.length} S3 event record(s)`);
    failures.forEach((failure) => console.error('Processing failure detail', { error: failure.message, stack: failure.stack }));
    throw error;
  }

  console.log('Email ingestion handler completed successfully', {
    recordCount: event.Records.length,
    timestamp: new Date().toISOString(),
  });
};

async function processRecord(record: S3EventRecord): Promise<void | Error> {
  const startTime = Date.now();
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  try {
    console.log('Processing S3 email record', {
      bucket,
      key,
      eventName: record.eventName,
      eventTime: record.eventTime,
      objectSize: record.s3.object.size,
    });

    const rawEmail = await fetchObjectBody(bucket, key);
    console.log('Fetched email from S3', {
      bucket,
      key,
      emailSize: rawEmail.length,
    });

    const parsedEmail = await simpleParser(rawEmail);
    console.log('Parsed email successfully', {
      bucket,
      key,
      from: parsedEmail.from?.text ?? 'unknown',
      subject: parsedEmail.subject ?? 'no subject',
      date: parsedEmail.date?.toISOString() ?? 'no date',
      hasText: !!parsedEmail.text,
      hasHtml: !!parsedEmail.html,
      attachmentCount: parsedEmail.attachments?.length ?? 0,
    });

    const content = extractPlainText(parsedEmail);
    console.log('Extracted email content', {
      bucket,
      key,
      contentLength: content.length,
    });

    const emailMessage = {
      sender: parsedEmail.from?.text ?? '',
      subject: parsedEmail.subject ?? '',
      date: parsedEmail.date?.toISOString() ?? new Date().toISOString(),
      content,
      bucket,
      key,
      event: record.eventName,
    };

    await publishEmailMessage(emailMessage);

    const processingTime = Date.now() - startTime;
    console.log('Email record processed successfully', {
      bucket,
      key,
      sender: emailMessage.sender,
      subject: emailMessage.subject,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Failed to process email record', {
      bucket,
      key,
      eventName: record.eventName,
      processingTimeMs: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return error instanceof Error ? error : new Error('Unknown error');
  }
}

async function fetchObjectBody(bucket: string, key: string): Promise<string> {
  console.log('Fetching object from S3', { bucket, key });

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    console.error('S3 object body is empty', { bucket, key });
    throw new Error('S3 object body is empty');
  }

  console.log('S3 object retrieved successfully', {
    bucket,
    key,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  });

  return streamToString(response.Body as Readable | ReadableStream | Blob | Uint8Array | string | Buffer);
}

async function streamToString(stream: Readable | ReadableStream | Blob | Uint8Array | string | Buffer): Promise<string> {
  if (typeof stream === 'string') {
    return stream;
  }

  if (Buffer.isBuffer(stream)) {
    return stream.toString('utf-8');
  }

  if (stream instanceof Uint8Array) {
    return Buffer.from(stream).toString('utf-8');
  }

  if (isBlob(stream)) {
    const arrayBuffer = await stream.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('utf-8');
  }

  if (isReadableStream(stream)) {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }

    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf-8');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream as Readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function isReadableStream(value: unknown): value is ReadableStream {
  return typeof ReadableStream !== 'undefined' && value instanceof ReadableStream;
}

interface EmailMessage {
  sender: string;
  subject: string;
  date: string;
  content: string;
  bucket: string;
  key: string;
  event: string;
}

async function publishEmailMessage(message: EmailMessage): Promise<void> {
  const deduplicationId = createHash('sha256').update(`${message.bucket}/${message.key}`).digest('hex');
  const messageGroupId = deriveMessageGroupId(message);

  console.log('Publishing email message to SQS', {
    queueUrl,
    messageGroupId,
    deduplicationId,
    sender: message.sender,
    subject: message.subject,
    bucket: message.bucket,
    key: message.key,
  });

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageGroupId: messageGroupId,
    MessageDeduplicationId: deduplicationId,
    MessageBody: JSON.stringify(message),
  });

  const result = await sqs.send(command);

  console.log('Email message published successfully', {
    messageId: result.MessageId,
    messageGroupId,
    deduplicationId,
    sender: message.sender,
    subject: message.subject,
  });
}

function deriveMessageGroupId(message: EmailMessage): string {
  if (message.sender) {
    return message.sender.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 128) || defaultMessageGroupId;
  }

  return defaultMessageGroupId;
}

function extractPlainText(parsed: ParsedMail): string {
  if (parsed.text) {
    console.log('Extracting plain text from email text field');
    return parsed.text.trim();
  }

  if (parsed.html) {
    console.log('Extracting plain text from HTML content');
    return stripHtml(parsed.html);
  }

  const attachments: ParsedMail['attachments'] = parsed.attachments || [];
  const textAttachment = attachments.find((attachment) => attachment.contentType === 'text/plain');

  if (textAttachment) {
    console.log('Extracting plain text from text attachment');
    return textAttachment.content.toString('utf-8').trim();
  }

  console.warn('No text content found in email', {
    hasText: !!parsed.text,
    hasHtml: !!parsed.html,
    attachmentCount: attachments.length,
  });
  return '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
