import { getUserColor, getUserInitials } from "@/lib/user-colors";

interface UserBadgeProps {
  name: string | null | undefined;
  showName?: boolean;
  size?: "sm" | "md";
}

export function UserBadge({ name, showName = true, size = "sm" }: UserBadgeProps) {
  const color = getUserColor(name);
  const initials = getUserInitials(name);
  const px = size === "sm" ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs";

  return (
    <span className="inline-flex items-center gap-1.5">
      {color.emoji ? (
        <span className={`${size === "sm" ? "text-sm" : "text-base"} flex-shrink-0`}>
          {color.emoji}
        </span>
      ) : (
        <span
          className={`${px} ${color.bg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
        >
          {initials}
        </span>
      )}
      {showName && name && (
        <span className={`${color.text} font-medium`}>{name}</span>
      )}
    </span>
  );
}
