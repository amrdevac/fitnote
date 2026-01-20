export const configApp = {
  pocketbase: {
    // If you need to access this on the client, use NEXT_PUBLIC_ prefix.
    base_url: process.env.NEXT_PUBLIC_POCKETBASE_BASE_URL || "http://127.0.0.1:8090/",
  },
  imagekitIO: {
    // Keep private key server-side only (no NEXT_PUBLIC_ prefix)
    private_key: process.env.IMAGEKIT_PRIVATE_KEY || "",
    // Public key can be exposed to client if needed
    public_key: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  },
};
