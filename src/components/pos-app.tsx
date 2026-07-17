"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Grid3x3,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PosLogin } from "@/components/pos-login";
import { PosRegister } from "@/components/pos-register";
import { PosDashboard } from "@/components/pos-dashboard";
import { PosKasir } from "@/components/pos-kasir";
import { PosProduk } from "@/components/pos-produk";
import { PosKategori } from "@/components/pos-kategori";
import { PosStok } from "@/components/pos-stok";
import { PosBarangMasuk } from "@/components/pos-barang-masuk";
import { PosBarangKeluar } from "@/components/pos-barang-keluar";
import { PosRiwayat } from "@/components/pos-riwayat";
import { PosLaporan } from "@/components/pos-laporan";
import { PosPengaturan } from "@/components/pos-pengaturan";
import { toast } from "sonner";

type PageType =
  | "dashboard"
  | "kasir"
  | "produk"
  | "kategori"
  | "stok"
  | "barang-masuk"
  | "barang-keluar"
  | "riwayat"
  | "laporan"
  | "pengaturan";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const navItems: { id: PageType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "kasir", label: "Kasir", icon: ShoppingCart },
  { id: "produk", label: "Produk", icon: Package },
  { id: "kategori", label: "Kategori", icon: Grid3x3 },
  { id: "stok", label: "Stok", icon: Warehouse },
  { id: "barang-masuk", label: "Barang Masuk", icon: ArrowDownToLine },
  { id: "barang-keluar", label: "Barang Keluar", icon: ArrowUpFromLine },
  { id: "riwayat", label: "Riwayat Transaksi", icon: Receipt },
  { id: "laporan", label: "Laporan", icon: BarChart3 },
  { id: "pengaturan", label: "Pengaturan", icon: Settings },
];

function SidebarContent({
  page,
  setPage,
  user,
  onLogout,
  collapsed,
}: {
  page: PageType;
  setPage: (p: PageType) => void;
  user: User;
  onLogout: () => void;
  collapsed: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {/* Logo & Brand */}
      <div
        className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center px-2" : ""}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Store className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex-1 sidebar-brand-text min-w-0">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="pos-gradient-text">KasirKu</span>
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight sidebar-subtitle">
              Sistem Kasir Modern
            </p>
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground sidebar-theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav
        className="
          flex-1
          overflow-y-auto
          overscroll-contain
          px-3
          py-3
          space-y-1
          min-h-0
          sidebar-scroll
        "
      >
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive = page === item.id;
            const btn = (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full ${collapsed ? "justify-center px-0" : "justify-start gap-3 px-3"} h-10 transition-all duration-200 sidebar-nav-btn ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setPage(item.id)}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                />
                {!collapsed && (
                  <span className="text-sm sidebar-label">{item.label}</span>
                )}
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return btn;
          })}
        </TooltipProvider>
      </nav>

      <Separator />

      {/* User Info & Logout */}
      <div
        className={`
          shrink-0
          border-t
          px-3
          py-3
          space-y-2
          ${collapsed ? "px-2" : ""}
        `}
      >
        {!collapsed ? (
          <>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-sm sidebar-logout-text">Keluar</span>
            </Button>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 sidebar-user-info">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className="text-[10px] h-5 px-1.5 mt-0.5"
                >
                  {user.role === "admin" ? "Admin" : "Kasir"}
                </Badge>
              </div>
            </div>
          </>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Keluar ({user.name})</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export function PosApp() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<PageType>("dashboard");
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const saved = localStorage.getItem("pos_user");
        if (!saved) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(saved) as User;
        const res = await fetch(`/api/auth/session?userId=${parsed.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.active) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
            });
          } else {
            localStorage.removeItem("pos_user");
          }
        } else {
          localStorage.removeItem("pos_user");
        }
      } catch {
        localStorage.removeItem("pos_user");
      } finally {
        setLoading(false);
      }
    };

    // Restore sidebar state
    const savedSidebar = localStorage.getItem("pos_sidebar_collapsed");
    if (savedSidebar) {
      setSidebarCollapsed(savedSidebar === "true");
    }

    checkSession();
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pos_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setPage("dashboard");
    toast.success(`Selamat datang, ${loggedInUser.name}!`);
  }, []);

  const handleRegister = useCallback((registeredUser: User) => {
    setUser(registeredUser);
    setPage("dashboard");
    toast.success(
      `Registrasi berhasil! Selamat datang, ${registeredUser.name}!`,
    );
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("pos_user");
    setUser(null);
    setPage("dashboard");
    toast.info("Berhasil keluar");
  }, []);

  const handlePageChange = useCallback((newPage: PageType) => {
    setPage(newPage);
    setMobileOpen(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm font-medium">
            Memuat KasirKu...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    if (showRegister) {
      return (
        <PosRegister
          onSwitchToLogin={() => setShowRegister(false)}
          onRegister={handleRegister}
        />
      );
    }
    return (
      <PosLogin
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // Render page
  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <PosDashboard user={user} />;
      case "kasir":
        return <PosKasir user={user} />;
      case "produk":
        return <PosProduk user={user} />;
      case "kategori":
        return <PosKategori user={user} />;
      case "stok":
        return <PosStok user={user} />;
      case "barang-masuk":
        return <PosBarangMasuk user={user} />;
      case "barang-keluar":
        return <PosBarangKeluar user={user} />;
      case "riwayat":
        return <PosRiwayat user={user} />;
      case "laporan":
        return <PosLaporan user={user} />;
      case "pengaturan":
        return <PosPengaturan user={user} />;
      default:
        return <PosDashboard user={user} />;
    }
  };

  const sidebarWidth = sidebarCollapsed ? 72 : 280;

  // Main layout
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 glass-sidebar z-30 sidebar-content-transition"
        style={{ width: sidebarWidth }}
      >
        <SidebarContent
          page={page}
          setPage={handlePageChange}
          user={user}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
        />
      </aside>

      {/* Sidebar Collapse/Expand Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`hidden lg:flex fixed top-5 z-40 h-7 w-7 items-center justify-center rounded-full bg-card border shadow-md text-muted-foreground hover:text-foreground hover:shadow-lg transition-all duration-300 sidebar-collapse-btn ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{ left: sidebarWidth - 13 }}
        aria-label={sidebarCollapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-3.5 w-3.5" />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40 h-10 w-10 bg-card/80 backdrop-blur-sm border shadow-sm"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="
                w-[280px]
                p-0
                h-[100dvh]
                flex
                flex-col
                overflow-hidden
                glass-sidebar
            "
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent
            page={page}
            setPage={handlePageChange}
            user={user}
            onLogout={handleLogout}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main
        className="flex-1 min-h-screen flex flex-col sidebar-content-transition"
        style={{
          marginLeft:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? sidebarWidth
              : 0,
        }}
      >
        {/* Top bar - mobile */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-16 py-3 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm pos-gradient-text">KasirKu</span>
          </div>
          <div className="flex-1" />
          <Badge variant="outline" className="text-[10px] h-6">
            {navItems.find((n) => n.id === page)?.label}
          </Badge>
        </header>

        {/* Page content */}
        <div className="flex-1 flex flex-col page-transition" key={page}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
