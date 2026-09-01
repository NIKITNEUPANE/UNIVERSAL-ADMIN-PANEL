'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@lumina-store.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/');
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/');
    }, 400);
  };

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
      <Card className="border-slate-800 bg-white/95 backdrop-blur-2xl shadow-2xl rounded-3xl p-2">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 mx-auto mb-2">
            <Store className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">
            Universal Store Admin
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Sign in to manage your e-commerce catalog and universal attributes.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">
                Instant Access
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleQuickDemoLogin}
            disabled={isLoading}
            className="w-full h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Single-Click Admin Login</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
