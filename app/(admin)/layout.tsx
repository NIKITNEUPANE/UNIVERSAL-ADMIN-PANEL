'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  SlidersHorizontal,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  Settings,
  Search,
  Bell,
  Plus,
  Boxes,
  Store as StoreIcon,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { dataStore } from '@/lib/data/store-data';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { ToastProvider } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profile = dataStore.getStoreProfile();

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/attributes', label: 'Global Attributes', icon: SlidersHorizontal, badge: 'Core' },
    { href: '/categories', label: 'Categories', icon: Layers },
    { href: '/products', label: 'Products & Options', icon: Package },
    { href: '/inventory', label: 'Inventory', icon: Boxes, badge: 'Stock' },
    { href: '/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/media', label: 'Media Library', icon: ImageIcon },
    { href: '/settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <ToastProvider>
      <div className="flex min-h-screen text-slate-900 font-sans antialiased relative selection:bg-indigo-500/20 selection:text-indigo-900">
        {/* Sidebar - Desktop (Liquid Glass Material) */}
        <aside className="hidden lg:flex w-64 flex-col liquid-glass-sidebar p-4 shrink-0 fixed inset-y-0 z-40">
          {/* Store Brand Card */}
          <div className="mb-6">
            <Link
              href="/settings"
              className="w-full flex items-center justify-between p-3 rounded-2xl liquid-glass-interactive text-left group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25 shrink-0 border border-white/40">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {profile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">Single Store Instance</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Store Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'liquid-glass-active text-indigo-950 font-bold'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:backdrop-blur-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-200/60 backdrop-blur-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Single Store System Status */}
          <div className="mt-auto pt-4 border-t border-slate-200/60">
            <div className="p-3 rounded-2xl liquid-glass-inset flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <div className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Universal Admin</p>
                  <p className="text-[10px] text-slate-500">Liquid Glass Engine</p>
                </div>
              </div>
              <Badge variant="default" className="text-[10px] px-2 py-0.5 font-bold bg-emerald-600/90 backdrop-blur-md text-white border-white/30 shadow-xs">
                Online
              </Badge>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 liquid-modal-panel p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="font-bold text-sm text-slate-900">{profile.name}</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'liquid-glass-active text-indigo-950 font-bold'
                          : 'text-slate-600 hover:bg-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Header Bar (Liquid Glass Material) */}
          <header className="h-16 liquid-glass-header px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl liquid-glass-interactive text-slate-700 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Quick Search Trigger */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl liquid-glass-input hover:border-slate-300 text-xs text-slate-500 hover:text-slate-800 transition-all w-48 sm:w-72 justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">Search attributes, units, navigation...</span>
                </div>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white/90 border border-slate-200 text-slate-500 font-mono text-[10px] shadow-2xs">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Switcher */}
              <CurrencySwitcher />

              {/* Add Attribute Quick Action */}
              <Link href="/attributes">
                <Button size="sm" className="hidden sm:flex items-center gap-2 liquid-button-primary text-white font-bold text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attributes</span>
                </Button>
              </Link>

              {/* Staff Profile & Logout */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/60">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/80 shadow-xs">
                  AD
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800">Store Administrator</p>
                  <p className="text-[10px] text-slate-400">admin@lumina-store.com</p>
                </div>
                <a
                  href="/login"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-all ml-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </a>
              </div>
            </div>
          </header>

          {/* Main Page Container - Balanced Negative Space */}
          <main className="flex-1 p-5 sm:p-7 lg:p-9 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      </div>
    </ToastProvider>
  );
}
