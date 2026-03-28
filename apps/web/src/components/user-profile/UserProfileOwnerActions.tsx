import { Edit, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

type UserProfileOwnerActionsProps = {
  isOwner?: boolean;
  availabilityStatus: "available" | "unavailable";
  isTogglingAvailability: boolean;
  onToggleAvailability: () => void;
};

export function UserProfileOwnerActions({
  isOwner,
  availabilityStatus,
  isTogglingAvailability,
  onToggleAvailability,
}: UserProfileOwnerActionsProps) {
  if (!isOwner) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 pt-4">
      <Link
        href="/setup-profile"
        className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/40 px-3 py-1.5 text-xs font-medium hover:bg-surface-container-high"
      >
        <Edit className="h-3.5 w-3.5" />
        Editar perfil
      </Link>

      <button
        type="button"
        onClick={onToggleAvailability}
        disabled={isTogglingAvailability}
        className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/40 px-3 py-1.5 text-xs font-medium hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
      >
        {availabilityStatus === "available" ? (
          <ToggleRight className="h-4 w-4 text-green-500" />
        ) : (
          <ToggleLeft className="h-4 w-4 text-on-surface-variant" />
        )}
        {availabilityStatus === "available" ? "Disponível" : "Indisponível"}
      </button>
    </div>
  );
}
