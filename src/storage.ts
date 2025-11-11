import { getUrl, remove, uploadData } from 'aws-amplify/storage';

export async function uploadPhotoBlob(blob: Blob, userId: string) {
  const key = `photos/${userId}/${Date.now()}.jpg`;
  const { key: storedKey } = await uploadData({
    key,
    data: blob,
    options: {
      contentType: 'image/jpeg',
      accessLevel: 'protected', // 'public' for guest-readable, 'private' for user-only
    },
  }).result;

  return storedKey; // Save this key to your GraphQL model if needed
}

export async function getPhotoUrl(key: string) {
  const { url } = await getUrl({ key, options: { accessLevel: 'protected', expiresIn: 3600 }});
  return url.toString();
}

export async function deletePhoto(key: string) {
  await remove({ key, options: { accessLevel: 'protected' }});
}
