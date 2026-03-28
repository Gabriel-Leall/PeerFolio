"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";

import {
  UserProfileBanner,
  UserProfileBannerSkeleton,
  UserProfileSidebar,
  UserProfileSidebarSkeleton,
  UserProfileTabs,
  UserProfileTabsSkeleton,
  UserProfileContentRail,
  UserProfileContentRailSkeleton,
} from "@/components/user-profile";
import type { UserProfileTab } from "@/components/user-profile/types";

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const { isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<UserProfileTab>("portfolios");
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  const profile = useQuery(api.users.queries.getProfile, {
    userId: params.userId,
  });

  const meQuery = useQuery(api.users.queries.getMe);
  const upsertProfile = useMutation(api.users.mutations.upsertProfile);

  const isLoading = profile === undefined;
  const isNotFound = profile === null;
  const isOwner = isSignedIn && meQuery?._id === profile?._id;

  const handleAvailabilityToggle = async () => {
    if (!isOwner || isTogglingAvailability) return;
    setIsTogglingAvailability(true);
    try {
      await upsertProfile({
        availabilityStatus:
          profile!.availabilityStatus === "available"
            ? "unavailable"
            : "available",
      });
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <UserProfileBannerSkeleton />
        <div className="grid gap-6 lg:grid-cols-[35%_65%]">
          <UserProfileSidebarSkeleton />
          <div className="space-y-4">
            <UserProfileTabsSkeleton />
            <UserProfileContentRailSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Usuário não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Este perfil não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Voltar ao feed
        </Link>
      </div>
    );
  }

  const displayName = profile.nickname ?? "Anônimo";

  return (
    <div className="space-y-0 overflow-x-hidden">
      <UserProfileBanner 
        bannerUrl={profile.bannerUrl} 
        isOwner={isOwner}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:h-[calc(100vh-5rem)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <UserProfileSidebar
            displayName={displayName}
            avatarUrl={profile.avatarUrl}
            bio={profile.bio}
            primaryArea={profile.primaryArea}
            portfoliosCount={profile.portfoliosCount}
            critiquesGivenCount={profile.critiquesGivenCount}
            upvotesReceivedCount={profile.upvotesReceivedCount}
            socialLinks={profile.socialLinks}
            isOwner={isOwner}
            availabilityStatus={profile.availabilityStatus}
            isTogglingAvailability={isTogglingAvailability}
            onToggleAvailability={handleAvailabilityToggle}
          />
        </div>

        <div className="space-y-4 lg:overflow-y-auto lg:pr-2 lg:pb-8">
          <UserProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            portfoliosCount={profile.portfolios.length}
            critiquesCount={profile.critiquesGiven.length}
          />

          <UserProfileContentRail
            activeTab={activeTab}
            portfolios={profile.portfolios}
            critiques={profile.critiquesGiven}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  );
}
