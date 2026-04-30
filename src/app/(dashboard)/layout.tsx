"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Home,
  CreditCard,
  FileText,
  MapPin,
  Link as LinkIcon,
  User,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Trophy,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationPrompt from "./dashboard/NotificationPrompt";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { detectLocale, useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navItemDefs = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Home },
  {
    href: "/dashboard/subscription",
    labelKey: "nav.myPackage",
    icon: CreditCard,
  },
  { href: "/dashboard/claims", labelKey: "nav.claims", icon: FileText },
  {
    href: "/dashboard/history",
    labelKey: "nav.visits",
    icon: ClipboardList,
  },
  { href: "/dashboard/champion", labelKey: "nav.champion", icon: Trophy },
  { href: "/dashboard/camps", labelKey: "nav.findClinic", icon: MapPin },
  {
    href: "/dashboard/transactions",
    labelKey: "nav.blockchain",
    icon: LinkIcon,
  },
  { href: "/dashboard/profile", labelKey: "nav.profile", icon: User },
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, member, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Apply locale from member preference on mount
  useEffect(() => {
    const locale = detectLocale(member?.preferredLanguage);
    i18n.changeLanguage(locale);
  }, [member?.preferredLanguage]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <img src="/logo.png" alt="MenoDAO" className="w-10 h-10" />
              <span className="font-bold text-xl text-gray-900 dark:text-white font-outfit hidden sm:block">
                MenoDAO
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center overflow-hidden lg:gap-0.5 xl:gap-1">
              {navItemDefs.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 whitespace-nowrap lg:px-2 lg:py-2 lg:text-xs xl:px-3 xl:text-sm px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop: Show user info and logout */}
              <div className="hidden md:flex items-center gap-3 min-w-0 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member?.fullName || "Member"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member?.phoneNumber}
                  </p>
                </div>
                <LanguageSwitcher className="hidden md:block" />
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={t("nav.logout")}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile: Theme Toggle */}
              <div className="md:hidden">
                <ThemeToggle />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg"
                aria-label={t("nav.menu")}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {member?.fullName || "Member"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {member?.phoneNumber}
              </p>
            </div>

            {navItemDefs.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.labelKey)}
                </Link>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-gray-700 mt-2"
            >
              <LogOut className="w-5 h-5" />
              {t("nav.logout")}
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Notification Permission Prompt */}
      <NotificationPrompt />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </I18nextProvider>
  );
}
