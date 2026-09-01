'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
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
    { href: '/inventory', label: 'Stock & Inventory', icon: Layers },
    { href: '/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/media', label: 'Media Library', icon: ImageIcon },
    { href: '/settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8f9fc] text-slate-900 font-sans antialiased">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl p-4 shrink-0 fixed inset-y-0 z-40 shadow-xs">
          {/* Store Brand Card (Direct single store identity - NO switcher) */}
          <div className="mb-6">
            <a
              href="/settings"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 transition-all text-left group shadow-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {profile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">Single Store Instance</p>
                </div>
              </div>
            </a>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 space-y-1 overflow-y-auto">
            <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Store Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Single Store System Status */}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Universal Admin</p>
                  <p className="text-[10px] text-slate-400">Phase 1 Active</p>
                </div>
              </div>
              <Badge variant="default" className="text-[10px] px-2 py-0 font-semibold bg-emerald-600 text-white">
                Online
              </Badge>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-white p-4 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="font-bold text-sm text-slate-900">{profile.name}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Header Bar */}
          <header className="h-16 border-b border-slate-200 bg-white/85 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Quick Search Trigger */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 hover:border-slate-300 text-xs text-slate-500 hover:text-slate-800 transition-all shadow-2xs w-48 sm:w-72 justify-between"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search attributes, units, navigation...</span>
                </div>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px] shadow-2xs">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Switcher */}
              <CurrencySwitcher />

              {/* Add Attribute Quick Action */}
              <a href="/attributes">
                <Button size="sm" className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attributes</span>
                </Button>
              </a>

              {/* Staff Profile & Logout */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100 shadow-2xs">
                  AD
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800">Store Administrator</p>
                  <p className="text-[10px] text-slate-400">admin@lumina-store.com</p>
                </div>
                <a
                  href="/login"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </a>
              </div>
            </div>
          </header>

          {/* Main Page Container */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      </div>
    </ToastProvider>
  );
}
