const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase storage credentials are not set in environment variables");
}

const BUCKET = "product-images";

export async function uploadProductImage(
  productId: number,
  buffer: Buffer,
  mimetype: string,
  originalFilename: string,
): Promise<string> {
  const ext = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
  const path = `product-${productId}-${Date.now()}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": mimetype,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload image: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
