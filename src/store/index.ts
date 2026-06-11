import { create } from 'zustand';

// ── UI Store ────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  sidebarHovered: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarHovered: (v: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarHovered: false,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarHovered: (v) => set({ sidebarHovered: v }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));

// ── Auth Store ──────────────────────────────────────

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; role: string; avatar: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true,
  user: {
    name: 'Chỉ huy Nguyễn',
    role: 'Quản trị Hệ thống',
    avatar: '',
  },
  login: (_email: string, _password: string) => {
    set({
      isAuthenticated: true,
      user: { name: 'Chỉ huy Nguyễn', role: 'Quản trị Hệ thống', avatar: '' },
    });
  },
  logout: () => set({ isAuthenticated: false, user: null }),
}));

// ── Alert Store ─────────────────────────────────────

interface AlertState {
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addAlert: (alert: AlertState['alerts'][number]) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  markAsRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: s.alerts.filter((a) => !a.read && a.id !== id).length,
    })),
  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
  addAlert: (alert) =>
    set((s) => ({
      alerts: [alert, ...s.alerts].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),
}));
