import { create } from 'zustand';
import { Group } from '../types';

interface GroupState {
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  removeGroup: (id: string) => void;
  activeGroupId: string | null;
  activeGroupName: string;
  myRoleInActiveGroup: string | null;
  setActiveGroup: (groupId: string | null, groupName?: string, role?: string | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  setGroups: (groups) => {
    set({ groups });
    const active = groups.find(group => group._id === get().activeGroupId);
    if (get().activeGroupId && !active) get().setActiveGroup(null);
    else if (active) get().setActiveGroup(active._id, active.name, active.myRole);
  },
  removeGroup: (id) => {
    set({ groups: get().groups.filter(group => group._id !== id) });
    if (get().activeGroupId === id) get().setActiveGroup(null);
  },
  activeGroupId: localStorage.getItem('moneyflow_active_group') || null,
  activeGroupName: localStorage.getItem('moneyflow_active_group_name') || 'Ví cá nhân',
  myRoleInActiveGroup: null,

  setActiveGroup: (groupId: string | null, groupName = 'Ví cá nhân', role: string | null = null) => {
    if (groupId) {
      localStorage.setItem('moneyflow_active_group', groupId);
      localStorage.setItem('moneyflow_active_group_name', groupName);
    } else {
      localStorage.removeItem('moneyflow_active_group');
      localStorage.removeItem('moneyflow_active_group_name');
    }
    set({
      activeGroupId: groupId,
      activeGroupName: groupName,
      myRoleInActiveGroup: role
    });
  }
}));
