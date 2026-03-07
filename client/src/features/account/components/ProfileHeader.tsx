import { motion } from 'framer-motion';
import { MapPin, Settings2, UserRoundPen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '../hooks/useUserPosts';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditProfile: () => void;
}

export const ProfileHeader = ({ profile, onEditProfile }: ProfileHeaderProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-white via-emerald-50/70 to-cyan-50/80 p-6 shadow-sm"
    >
      <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-20 border-2 border-white shadow-md">
            <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
            <AvatarFallback>{profile.fullName.slice(0, 1)}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
            <p className="text-sm text-slate-600">@{profile.username}</p>
            <div className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="size-4 text-emerald-600" />
              <span>
                {profile.neighborhood}, {profile.city}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onEditProfile} className="bg-emerald-600 hover:bg-emerald-700">
            <UserRoundPen className="size-4" />
            Edit Profile
          </Button>
          <Button variant="outline" type="button">
            <Settings2 className="size-4" />
            Settings
          </Button>
        </div>
      </div>
    </motion.section>
  );
};
