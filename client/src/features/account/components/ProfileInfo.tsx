import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProfile } from '../hooks/useUserPosts';

interface ProfileInfoProps {
  profile: UserProfile;
}

const formatDate = (isoDate: string) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return formatter.format(new Date(isoDate));
};

export const ProfileInfo = ({ profile }: ProfileInfoProps) => {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-slate-200 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Full Name</p>
            <p className="text-sm font-medium text-slate-900">{profile.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Username</p>
            <p className="text-sm font-medium text-slate-900">@{profile.username}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm font-medium text-slate-900">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Phone Number</p>
            <p className="text-sm font-medium text-slate-900">{profile.phone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">City</p>
            <p className="text-sm font-medium text-slate-900">{profile.city}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Neighborhood</p>
            <p className="text-sm font-medium text-slate-900">{profile.neighborhood}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-slate-500">Short Bio</p>
            <p className="text-sm font-medium text-slate-900">{profile.bio}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-slate-500">Account Created</p>
            <p className="text-sm font-medium text-slate-900">{formatDate(profile.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Verification Status</p>
            <Badge
              variant={profile.verificationStatus === 'verified' ? 'default' : 'secondary'}
              className="mt-1 capitalize"
            >
              {profile.verificationStatus}
            </Badge>
          </div>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Account Settings (coming soon)</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>Change password</li>
              <li>Notification preferences</li>
              <li>Privacy settings</li>
              <li>Delete account</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
