import { apiFetch } from "@/lib/api-client"
import { MAX_UPLOAD_BYTES, UPLOAD_TIMEOUT_MS } from "@/lib/upload-constants"

export {
  MAX_UPLOAD_BYTES,
  UPLOAD_TIMEOUT_MS,
  UPLOAD_ACCEPT,
  isUploadableImage,
} from "@/lib/upload-constants"

export type UploadResult =
  | { ok: true; url: string; name?: string }
  | {
      ok: false
      /** Discriminator for i18n — never put localized copy in the helper. */
      reason: "network" | "failed"
      /** Server-provided message when present; callers fall back to i18n. */
      message?: string
      status?: number
    }

/** POST a single image to /api/upload with the shared timeout. */
export async function uploadImageFile(file: File): Promise<UploadResult> {
  const body = new FormData()
  body.append("file", file)
  try {
    const res = await apiFetch("/api/upload", {
      method: "POST",
      body,
      timeout: UPLOAD_TIMEOUT_MS,
    })
    const data = (await res.json().catch(() => ({}))) as {
      url?: string
      name?: string
      error?: string
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: "failed",
        message: data.error,
        status: res.status,
      }
    }
    if (!data.url) {
      return { ok: false, reason: "failed", status: res.status }
    }
    return { ok: true, url: data.url, name: data.name }
  } catch {
    return { ok: false, reason: "network" }
  }
}

/** Pre-flight check used by batch upload UIs before hitting the network. */
export function validateImageFile(file: File): "ok" | "type" | "size" {
  if (!file.type.startsWith("image/")) return "type"
  if (file.size > MAX_UPLOAD_BYTES) return "size"
  return "ok"
}
