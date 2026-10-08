export const hasPrivateGroupDetails = (req: any): boolean => req.userRoleInGroup === 'member' && Boolean(req.group?.settings?.hideAmountsForMembers);
export const ownDetailsFilter = (req: any) => hasPrivateGroupDetails(req) ? { ownerId: req.user._id } : {};
