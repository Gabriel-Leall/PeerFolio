export type UserProfileTab = "portfolios" | "critiques";

export type UserProfileSocialLinks = {
  github?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
};

export type UserProfilePortfolio = {
  _id: string;
  title: string;
  area: string;
  stack: string[];
  averageRating: number;
  critiqueCount: number;
  likeCount: number;
  previewImageUrl?: string;
  normalizedUrl: string;
  createdAt: number;
};

export type UserProfileCritique = {
  _id: string;
  portfolioId: string;
  rating: number;
  feedback: string;
  upvotes: number;
  createdAt: number;
  portfolioTitle: string | null;
  portfolioArea: string | null;
};
