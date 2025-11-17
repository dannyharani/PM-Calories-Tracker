export function isStorageConfigured(): boolean {
    // const bucket = (awsconfig as any)?.aws_user_files_s3_bucket;
    // const region = (awsconfig as any)?.aws_user_files_s3_bucket_region;
    return Boolean(true);
}

export function getStorageMissingMessage(): string {
    return "Photo storage is not configured. Please add Amplify Storage (S3) and run `amplify push`, or continue without photos.";
}
