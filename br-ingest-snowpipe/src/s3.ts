import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export const s3 = new S3Client({});

export async function uploadStream(params: {
  Bucket: string;
  Key: string;
  Body: Readable;
  ContentType?: string;
  ContentEncoding?: string;
}) {
  const upload = new Upload({ client: s3, params });
  await upload.done();
}
