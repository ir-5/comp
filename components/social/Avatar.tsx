import type { SampleUser } from '@/lib/socialTypes';

interface Props {
  user: Pick<SampleUser, 'avatar' | 'accent' | 'displayName'>;
  size?: number;
}

export default function Avatar({ user, size = 40 }: Props) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: user.accent, fontSize: size * 0.5 }}
      aria-label={user.displayName}
    >
      <span>{user.avatar}</span>
    </div>
  );
}
