/** Member + invitation row types for Settings. */

export type MemberRow = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

export type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export type MemberTableMeta = {
  currentUserId?: string;
  canManage: boolean;
  busyId: string | null;
  onMakeOwner: (member: MemberRow) => void;
  onRemove: (member: MemberRow) => void;
};
