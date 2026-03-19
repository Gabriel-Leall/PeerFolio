import type { Id } from "@PeerFolio/backend/convex/_generated/dataModel";
import type { Metadata } from "next";

import PortfolioDetailClient from "./PortfolioDetailClient";

type PortfolioDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Portfólio | PeerFolio",
};

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const { id } = await params;

  return <PortfolioDetailClient portfolioId={id as Id<"portfolios">} />;
}
