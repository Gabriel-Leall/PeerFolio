import { Globe, Github, Linkedin, Twitter } from "lucide-react";
import type { ReactNode } from "react";

import type { UserProfileSocialLinks } from "./types";
import { getInitial } from "./utils";
import { UserProfileOwnerActions } from "./UserProfileOwnerActions";
import { ProfileImageUpload } from "./ProfileImageUpload";

type UserProfileSidebarProps = {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  primaryArea?: string;
  portfoliosCount: number;
  critiquesGivenCount: number;
  upvotesReceivedCount: number;
  socialLinks?: UserProfileSocialLinks;
  isOwner?: boolean;
  availabilityStatus: "available" | "unavailable";
  isTogglingAvailability: boolean;
  onToggleAvailability: () => void;
  onAvatarChange?: (url: string) => void;
};

function SocialLink({ href, label, children }: { href?: string; label: string; children: ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-md border border-outline-variant/30 bg-surface-container-low p-2 text-on-surface-variant transition hover:border-primary/40 hover:text-primary"
    >
      {children}
    </a>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="font-serif text-xl italic text-primary">{value}</span>
    </div>
  );
}

export function UserProfileSidebar({
  displayName,
  avatarUrl,
  bio,
  primaryArea,
  portfoliosCount,
  critiquesGivenCount,
  upvotesReceivedCount,
  socialLinks,
  isOwner,
  availabilityStatus,
  isTogglingAvailability,
  onToggleAvailability,
  onAvatarChange,
}: UserProfileSidebarProps) {
  return (
    <aside className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 md:p-8">
      <div className="flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-outline-variant/40 bg-surface-container-high">
          {avatarUrl ? (
            <img src={avatarUrl} alt={`Avatar de ${displayName}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-primary">
              {getInitial(displayName)}
            </div>
          )}
          <ProfileImageUpload
            type="avatar"
            currentImageUrl={avatarUrl}
            onUploadComplete={onAvatarChange || (() => {})}
            isOwner={isOwner || false}
            className="absolute inset-0 z-10 rounded-full bg-transparent outline-none transition-colors hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div className="min-w-0">
          <h1 className="truncate font-serif text-4xl italic leading-none text-primary">
            {displayName}
          </h1>
          {primaryArea ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              {primaryArea}
            </p>
          ) : null}
        </div>
      </div>

      {bio ? (
        <div className="mt-6 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
          <h2 className="font-serif text-xl italic text-primary">The Curator&apos;s Note</h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{bio}</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <MetricRow label="Portfólios" value={portfoliosCount} />
        <MetricRow label="Críticas dadas" value={critiquesGivenCount} />
        <MetricRow label="Upvotes recebidos" value={upvotesReceivedCount} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <SocialLink href={socialLinks?.github} label="GitHub">
          <Github className="h-4 w-4" />
        </SocialLink>
        <SocialLink href={socialLinks?.twitter} label="Twitter">
          <Twitter className="h-4 w-4" />
        </SocialLink>
        <SocialLink href={socialLinks?.linkedin} label="LinkedIn">
          <Linkedin className="h-4 w-4" />
        </SocialLink>
        <SocialLink href={socialLinks?.website} label="Website">
          <Globe className="h-4 w-4" />
        </SocialLink>
      </div>

      <UserProfileOwnerActions
        isOwner={isOwner}
        availabilityStatus={availabilityStatus}
        isTogglingAvailability={isTogglingAvailability}
        onToggleAvailability={onToggleAvailability}
      />
    </aside>
  );
}
