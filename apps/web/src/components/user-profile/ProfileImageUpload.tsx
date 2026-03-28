"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { Camera } from "lucide-react";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  type: "avatar" | "banner";
  currentImageUrl?: string;
  onUploadComplete?: (url: string) => void;
  isOwner: boolean;
  className?: string;
  showIconOnly?: boolean;
}

export function ProfileImageUpload({
  type,
  currentImageUrl,
  onUploadComplete,
  isOwner,
  className,
  showIconOnly = false,
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const getStorageUrl = useMutation(api.upload.getStorageUrl);
  const upsertProfile = useMutation(api.users.mutations.upsertProfile);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();

      const url = await getStorageUrl({ storageId });

      const fieldToUpdate = type === "avatar" ? "avatarUrl" : "bannerUrl";
      await upsertProfile({
        [fieldToUpdate]: url,
      });

      toast.success(
        type === "avatar" ? "Avatar atualizado com sucesso!" : "Banner atualizado com sucesso!",
      );
      onUploadComplete?.(url);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOwner) return null;

  const iconPositionStyles =
    type === "avatar"
      ? "-bottom-1 -right-1 p-1.5"
      : "bottom-2 right-2 p-2";
  const uploadLabel = `Alterar ${type === "avatar" ? "avatar" : "banner"}`;
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {!showIconOnly ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className={className}
          aria-label={uploadLabel}
          title={uploadLabel}
        />
      ) : null}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute ${iconPositionStyles} rounded-full border border-outline-variant/50 bg-surface-container/90 text-on-surface-variant shadow-sm`}
      >
        <Camera className={type === "avatar" ? "h-4 w-4" : "h-5 w-5"} />
      </span>
    </>
  );
}
