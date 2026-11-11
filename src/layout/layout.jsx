import React, { useEffect, useState, useMemo } from "react";
import {
  Dropdown,
  Tooltip,
  Avatar,
  Badge,
  Modal,
  Input,
} from "antd";
import {
  LayoutDashboard,
  Tag as TagIcon,
  Store,
  Layers,
  Sliders,
  Sparkles,
  Users,
  AlertTriangle,
  Bell,
  Contact,
  MapPin,
  CreditCard,
  Wallet,
  CloudUpload,
  UserX,
  Scale,
  History,
  LogOut,
  ChevronRight,
  Shield,
  ShieldAlert,
  Search,
  Zap,
  Settings,
  Menu as MenuIcon,
  X,
  Activity,
  CheckCircle2,
  KeyRound,
  Database,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../config/auth/api";
import useAuthStore from "../store";

const NAV_GROUPS = [
  {
    group: "BOSHQARUV",
    items: [
      {
        path: "/dashboard",
        icon: LayoutDashboard,
        label: "Boshqaruv Paneli",
        desc: "Telemetriya & asosiy ko'rsatkichlar",
      },
      {
        path: "/health",
        icon: Activity,
        label: "Platforma Salomatligi",
        desc: "Infratuzilma, DB, kesh & xizmatlar",
        badge: "V2.2",
        badgeColor: "bg-emerald-100 text-emerald-800",
      },
    ],
  },
  {
    group: "XAVFSIZLIK & SOC",
    items: [
      {
        path: "/soc",
        icon: ShieldAlert,
        label: "SOC Xavfsizlik Markazi",
        desc: "Tahdidlar & faol sessiyalar",
        badge: "SOC",
        badgeColor: "bg-blue-100 text-blue-700",
      },
      {
        path: "/audit-logs",
        icon: History,
        label: "Audit Jurnali & Loglar",
        desc: "Ma'muriy harakatlar tarixi",
      },
      {
        path: "/otp-security",
        icon: KeyRound,
        label: "OTP & Testers Siyosati",
        desc: "Autentifikatsiya xavfsizligi",
      },
      {
        path: "/security-policies",
        icon: Scale,
        label: "Xavfsizlik Hujjatlari",
        desc: "Normativ qoidalar & siyosat",
      },
    ],
  },
  {
    group: "FOYDALANUVCHILAR & CRM",
    items: [
      {
        path: "/users",
        icon: Users,
        label: "Foydalanuvchilar CRM",
        desc: "Mijozlar bazasi va moderatsiya",
      },
      {
        path: "/profiles",
        icon: Contact,
        label: "Profillar Reestri",
        desc: "Tasdiqlangan shaxsiy profillar",
      },
      {
        path: "/deletions",
        icon: UserX,
        label: "Hisob O'chirish Ops",
        desc: "Account deletion arizalari",
      },
    ],
  },
  {
    group: "SAVDO & E'LONLAR",
    items: [
      {
        path: "/products",
        icon: TagIcon,
        label: "E'lonlar Moderatsiyasi",
        desc: "Kelib tushgan e'lonlarni tekshirish",
      },
      {
        path: "/shops",
        icon: Store,
        label: "Rasmiy Do'konlar",
        desc: "Do'konlar katalogi va holati",
      },
      {
        path: "/categories",
        icon: Layers,
        label: "Kategoriyalar Studio",
        desc: "Katalog ierarxiyasi & ikonlar",
      },
      {
        path: "/properties",
        icon: Sliders,
        label: "Dinamik Xususiyatlar",
        desc: "Parametrlar & xususiyatlar",
      },
      {
        path: "/product-parameters",
        icon: TagIcon,
        label: "Mahsulot Parametrlari",
        desc: "E'lon turlari, holat va to'lov turlari",
        badge: "E'lon turlari",
        badgeColor: "bg-amber-100 text-amber-800",
      },
      {
        path: "/banners",
        icon: Sparkles,
        label: "Promo & Bannerlar",
        desc: "Marketing bannerlari",
      },
    ],
  },
  {
    group: "MODERATSIYA & HISOBOTLAR",
    items: [
      {
        path: "/reports",
        icon: AlertTriangle,
        label: "Shikoyatlar Markazi",
        desc: "Foydalanuvchi murojaatlari",
      },
    ],
  },
  {
    group: "XABARLAR & BILDIRISHNOMALAR",
    items: [
      {
        path: "/notifications",
        icon: Bell,
        label: "Push Bildirishnomalar",
        desc: "Ommaviy va maqsadli pushlar",
      },
    ],
  },
  {
    group: "TO'LOVLAR & INTEGRATSIYALAR",
    items: [
      {
        path: "/payments",
        icon: CreditCard,
        label: "To'lovlar & Tranzaksiyalar",
        desc: "Payme tranzaksiyalari",
      },
      {
        path: "/expenses",
        icon: Wallet,
        label: "Server & CDN Xarajatlari",
        desc: "Infratuzilma xarajatlari",
      },
      {
        path: "/migration",
        icon: CloudUpload,
        label: "Bunny CDN Xotira",
        desc: "Media fayllar ombori",
      },
      {
        path: "/locations",
        icon: MapPin,
        label: "Hududlar & Manzillar",
        desc: "Viloyat va tumanlar bazasi",
      },
    ],
  },
  {
    group: "TIZIM SOZLAMALARI",
    items: [
      {
        path: "/settings",
        icon: Settings,
        label: "Tizim Sozlamalari & Flags",
        desc: "Control Plane, Kill Switches & Konfiguratsiya",
      },
    ],
  },
  {
    group: "QO'LLANMA & HUJJATLAR",
    items: [
      {
        path: "/guide",
        icon: BookOpen,
        label: "Admin Qo'llanma & Yordam",
        desc: "To'liq foydalanish yo'riqnomasi & FAQ",
        badge: "V2.1",
        badgeColor: "bg-emerald-100 text-emerald-800",
      },
    ],
  },
];

const AppLayout = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Keyboard shortcut Ctrl+K or Cmd+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Real backend health check telemetry
  const { data: dashboardStats } = useQuery({
    queryKey: ["layout-quick-telemetry"],
    queryFn: async () => {
      try {
        const res = await api.get("/admin/dashboard/stats");
        return res.data?.content || res.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
  };

  const getPageMeta = () => {
    const path = location.pathname;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.path === path || (item.path !== "/dashboard" && path.startsWith(item.path))) {
          return {
            title: item.label,
            group: group.group,
            icon: item.icon,
            desc: item.desc,
          };
        }
      }
    }
    return {
      title: "Boshqaruv Paneli",
      group: "BOSHQARUV",
      icon: LayoutDashboard,
      desc: "Kelishamiz operatsion boshqaruv markazi",
    };
  };

  const pageMeta = getPageMeta();
  const CurrentIcon = pageMeta.icon;

  // Search filter inside command palette
  const allNavItems = useMemo(() => {
    const list = [];
    NAV_GROUPS.forEach((g) => {
      g.items.forEach((item) => {
        list.push({ ...item, group: g.group });
      });
    });
    return list;
  }, []);

  const filteredCommands = useMemo(() => {
    if (!commandSearch.trim()) return allNavItems;
    const q = commandSearch.toLowerCase();
    return allNavItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    );
  }, [allNavItems, commandSearch]);

  const adminDisplayName = user?.fullName || user?.username || "Administrator";
  const adminIdentifier = user?.phone || user?.username || "admin@kelishamiz.uz";
  const adminRoleDisplay = user?.role || "ADMIN";
  const avatarLetter = (user?.username?.[0] || user?.fullName?.[0] || "A").toUpperCase();

  const userMenu = {
    items: [
      {
        key: "profile",
        label: (
          <div className="py-1 px-1">
            <div className="font-semibold text-slate-900 text-xs">{adminDisplayName}</div>
            <div className="text-[11px] text-slate-500 font-mono">{adminIdentifier}</div>
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {adminRoleDisplay}
              </span>
            </div>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
      {
        key: "soc_quick",
        icon: <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />,
        label: <span className="text-xs font-medium">SOC Xavfsizlik Markazi</span>,
        onClick: () => navigate("/soc"),
      },
      {
        key: "settings_quick",
        icon: <Settings className="w-3.5 h-3.5 text-slate-600" />,
        label: <span className="text-xs font-medium">Tizim Sozlamalari</span>,
        onClick: () => navigate("/settings"),
      },
      {
        key: "audit_quick",
        icon: <History className="w-3.5 h-3.5 text-slate-600" />,
        label: <span className="text-xs font-medium">Audit Loglari</span>,
        onClick: () => navigate("/audit-logs"),
      },
      { type: "divider" },
      {
        key: "logout",
        danger: true,
        icon: <LogOut className="w-3.5 h-3.5" />,
        label: <span className="text-xs font-semibold">Tizimdan Chiqish</span>,
        onClick: handleLogout,
      },
    ],
  };

  const dbLatency = dashboardStats?.systemHealth?.databaseLatencyMs ?? 8;
  const isHealthy = dashboardStats?.systemHealth?.database !== "UNAVAILABLE";

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* 1. PERSISTENT DESKTOP SIDEBAR (ALWAYS EXPANDED ON DESKTOP)     */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200 flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30 select-none">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-black text-lg shadow-xs">
                K
              </div>
              <div>
                <div className="text-slate-900 font-bold text-sm tracking-tight flex items-center gap-1.5">
                  KELISHAMIZ
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    ADMIN
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium">
                  Operations & SOC Center
                </div>
              </div>
            </div>
          </div>

          {/* Quick Command Trigger in Sidebar */}
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>Tezkor o'tish...</span>
              </span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-400 font-semibold shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Items (Grouped) */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-none">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <ItemIcon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-blue-700" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      {item.badge && (
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                            item.badgeColor || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: System Status & User Profile */}
          <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0 space-y-2">
            {/* Live Operational Status */}
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 font-medium text-slate-600">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? "bg-emerald-500" : "bg-amber-500"
                  } animate-pulse`}
                />
                <span>Tizim: {isHealthy ? "Barqaror" : "Diqqat"}</span>
              </div>
              <span className="font-mono text-slate-400 text-[10px]">{dbLatency}ms</span>
            </div>

            {/* Admin Mini Profile */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  className="bg-blue-700 font-bold text-white text-xs flex-shrink-0"
                  size={32}
                >
                  {avatarLetter}
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {adminDisplayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {adminRoleDisplay}
                  </div>
                </div>
              </div>

              <Tooltip title="Tizimdan chiqish">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE / TABLET DRAWER OVERLAY                              */}
      {/* ------------------------------------------------------------- */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between shadow-2xl z-10">
            {/* Header */}
            <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-black text-sm">
                  K
                </div>
                <div className="text-sm font-bold text-slate-900">KELISHAMIZ ADMIN</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.group} className="space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    {group.group}
                  </div>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          navigate(item.path);
                          setMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <ItemIcon
                            className={`w-4 h-4 ${
                              isActive ? "text-blue-700" : "text-slate-400"
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">Administrator</div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. RIGHT MAIN VIEW (TOPBAR + CONTENT)                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-6">
          {/* Left: Mobile hamburger & Contextual Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                <CurrentIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate("/dashboard")}>
                    Admin
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-slate-500 uppercase text-[10.5px] font-semibold tracking-wider">
                    {pageMeta.group}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                  {pageMeta.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Quick actions, Live telemetry & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Command Palette Button on Topbar */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Qidiruv / Sahifalar</span>
              <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-400 font-semibold">
                ⌘K
              </kbd>
            </button>

            {/* Quick Action: SOC Shortcut */}
            <Tooltip title="Security Operations Center">
              <button
                type="button"
                onClick={() => navigate("/soc")}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span>SOC</span>
              </button>
            </Tooltip>

            {/* Quick Action: Push Notification */}
            <Tooltip title="Tezkor Push Xabar Yuborish">
              <button
                type="button"
                onClick={() => navigate("/notifications")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Push Xabar</span>
              </button>
            </Tooltip>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200" />

            {/* User Dropdown */}
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors">
                <Avatar
                  className="bg-blue-700 text-white font-bold text-xs ring-1 ring-slate-200"
                  size={32}
                >
                  {avatarLetter}
                </Avatar>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {adminDisplayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono leading-tight">
                    {adminRoleDisplay}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* MAIN PAGE CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. COMMAND PALETTE MODAL (CTRL+K / CMD+K)                      */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={commandPaletteOpen}
        onCancel={() => {
          setCommandPaletteOpen(false);
          setCommandSearch("");
        }}
        footer={null}
        closable={false}
        width={560}
        styles={{ body: { padding: 0 } }}
        centered
      >
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Sahifa yoki bo'lim nomini yozing..."
            value={commandSearch}
            onChange={(e) => setCommandSearch(e.target.value)}
            autoFocus
            className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-400 font-semibold">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              Hech qanday sahifa topilmadi
            </div>
          ) : (
            filteredCommands.map((item) => {
              const CmdIcon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setCommandPaletteOpen(false);
                    setCommandSearch("");
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 flex items-center justify-center text-slate-600 transition-colors flex-shrink-0">
                      <CmdIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 uppercase font-mono">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Tezkor navigatsiya</span>
          <span className="font-mono">Kelishamiz Enterprise Suite</span>
        </div>
      </Modal>
    </div>
  );
};

export default AppLayout;
