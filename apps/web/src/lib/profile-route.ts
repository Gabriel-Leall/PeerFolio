type ProfileIdentity = {
  nickname?: string | null;
  _id?: string | null;
};

export function getProfileRoute(identity: ProfileIdentity | null | undefined): string {
  const nickname = identity?.nickname?.trim();

  if (nickname) {
    return `/profile/${encodeURIComponent(nickname)}`;
  }

  if (identity?._id) {
    return `/profile/${identity._id}`;
  }

  return "/profile";
}
