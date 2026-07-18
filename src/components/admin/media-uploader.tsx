"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

interface MediaUploaderProps {
  onUpload?: (url: string) => void
}

export function MediaUploader({ onUpload }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("Image uploaded successfully!")
        if (onUpload) {
          onUpload(data.url)
        }
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Upload failed")
      }
    } catch {
      toast.error("Network error. Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleUpload}
        className="hidden"
        id="media-upload"
      />
      <Button
        variant="outline"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>
    </div>
  )
}
