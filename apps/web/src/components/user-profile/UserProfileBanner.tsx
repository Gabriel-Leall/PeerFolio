import { ProfileImageUpload } from "./ProfileImageUpload";

type UserProfileBannerProps = {
  bannerUrl?: string;
  isOwner?: boolean;
  onBannerChange?: (url: string) => void;
};

export function UserProfileBanner({ bannerUrl, isOwner, onBannerChange }: UserProfileBannerProps) {
  return (
    <div
      className="relative w-full min-h-[160px] max-h-[280px] overflow-hidden bg-surface-container"
      style={{ aspectRatio: "16 / 4" }}
    >
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt="Banner do perfil"
          className="h-full w-full object-cover"
        />
      ) : null}
      <ProfileImageUpload
        type="banner"
        currentImageUrl={bannerUrl}
        onUploadComplete={onBannerChange}
        isOwner={isOwner || false}
        className="absolute inset-0 z-10 bg-transparent outline-none transition-colors hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}
