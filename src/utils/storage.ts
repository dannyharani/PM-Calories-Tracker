import awsconfig from '@/src/aws-exports';
import { getProperties, getUrl } from 'aws-amplify/storage';

export function isStorageConfigured(): boolean {
  const bucket = (awsconfig as any)?.aws_user_files_s3_bucket;
  const region = (awsconfig as any)?.aws_user_files_s3_bucket_region;
  return Boolean(bucket && region);
}

export function getStorageMissingMessage(): string {
  return 'Photo storage is not configured. Please add Amplify Storage (S3) and run `amplify push`, or continue without photos.';
}

// Fetch S3 object properties including user-defined metadata
export async function fetchObjectMetadata(key: string): Promise<{
  contentType?: string;
  size?: number;
  lastModified?: Date;
  metadata?: Record<string, string>;
}> {
  const res = await getProperties({ key });
  return {
    contentType: (res as any)?.contentType,
    size: (res as any)?.contentLength,
    lastModified: (res as any)?.lastModified,
    metadata: (res as any)?.metadata ?? {},
  };
}

// Optional helper to get a temporary URL for displaying the image
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const result: any = await getUrl({ key, options: { expiresIn } });
  // Amplify returns a URL object in v6
  const url = result?.url ?? result;
  return typeof url === 'string' ? url : (url as URL).toString();
}
