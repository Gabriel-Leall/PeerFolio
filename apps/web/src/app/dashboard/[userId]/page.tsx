"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";

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
import { ProfileNotFoundState } from "@/components/profile/ProfileNotFoundState";

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

  useEffect(() => {
    if (!isNotFound) return;
    if (typeof window !== "undefined" && window.location.pathname !== "/error") {
      window.history.replaceState(null, "", "/error");
    }
  }, [isNotFound]);

  useEffect(() => {
    if (!profile?.nickname) return;
    const nicknamePath = `/profile/${profile.nickname}`;
    if (typeof window !== "undefined" && window.location.pathname !== nicknamePath) {
      window.history.replaceState(null, "", nicknamePath);
    }
  }, [profile?.nickname]);

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
    return <ProfileNotFoundState />;
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
