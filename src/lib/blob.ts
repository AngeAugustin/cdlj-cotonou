import { put } from "@vercel/blob";

type UploadInput = Buffer | ArrayBuffer | Blob | File | ReadableStream | string;

export async function uploadToBlob(
  pathname: string,
  data: UploadInput,
  options?: { contentType?: string }
): Promise<string> {
  const blob = await put(pathname, data, {
    access: "public",
    contentType: options?.contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}
