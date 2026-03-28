import * as React from "react";
import { cn } from "@PeerFolio/ui/lib/utils";

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function TruncatedText({ text, maxLength = 60, className }: TruncatedTextProps) {
  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }

  const truncated = text.slice(0, maxLength).trimEnd() + "…";

  return (
    <span
      title={text}
      className={cn("cursor-help underline decoration-dotted underline-offset-2", className)}
    >
      {truncated}
    </span>
  );
}
