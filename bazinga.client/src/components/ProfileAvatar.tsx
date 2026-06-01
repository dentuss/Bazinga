import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/profiles";

export type ProfileAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ProfileAvatarProps {
  profile: Pick<Profile, "name" | "avatarUrl" | "avatarColor" | "avatarIcon">;
  size?: ProfileAvatarSize;
  className?: string;
  rounded?: "md" | "lg" | "full";
}

const sizeClasses: Record<ProfileAvatarSize, string> = {
  xs: "h-7 w-7 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-20 w-20 text-3xl",
  xl: "h-28 w-28 md:h-32 md:w-32 text-4xl md:text-5xl",
};

const roundedClasses = {
  md: "rounded-md",
  lg: "rounded-xl",
  full: "rounded-full",
} as const;

export const ProfileAvatar = ({
  profile,
  size = "md",
  className,
  rounded = "md",
}: ProfileAvatarProps) => {
  const initial = profile.name?.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden font-black text-white shadow-sm select-none",
        sizeClasses[size],
        roundedClasses[rounded],
        className
      )}
      style={{ backgroundColor: profile.avatarUrl ? undefined : profile.avatarColor }}
      aria-label={profile.name}
    >
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="leading-none">{profile.avatarIcon || initial}</span>
      )}
    </div>
  );
};

export default ProfileAvatar;
