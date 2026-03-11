'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Mail, Bookmark, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useState, useRef, useEffect } from 'react';

function playClick() {
  const audio = new Audio('/sounds/ui-button-click.wav');
  audio.volume = 0.4;
  audio.play().catch(() => {});
}

export default function Navigation({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const isToday = pathname === '/' || pathname.startsWith('/email');
  const isBookmarks = pathname === '/bookmarks';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!user) return null;

  return (
    <nav aria-label="Main" className="w-full h-11 bg-grey-05 flex items-end">
      <div className="max-w-[680px] mx-auto px-4 w-full flex items-end justify-between">
        <div className="inline-flex justify-start items-center gap-1">
          <Link
            href="/"
            aria-current={isToday ? 'page' : undefined}
            onClick={playClick}
            className={`group w-36 h-8 p-2 rounded-tl-lg rounded-tr-lg flex justify-start items-center gap-3 cursor-default transition-colors ${
              isToday ? 'bg-white' : ''
            }`}
          >
            <Mail
              size={16}
              aria-hidden="true"
              className={`transition-colors ${isToday ? 'text-grey-4' : 'text-grey-2 group-hover:text-grey-3'}`}
              strokeWidth={1.33}
            />
            <span
              className={`text-sm font-semibold font-['Figtree'] leading-6 transition-colors ${
                isToday ? 'text-grey-4' : 'text-grey-2 group-hover:text-grey-4'
              }`}
            >
              Today
            </span>
          </Link>
          <Link
            href="/bookmarks"
            aria-current={isBookmarks ? 'page' : undefined}
            onClick={playClick}
            className={`group w-36 h-8 p-2 rounded-tl-lg rounded-tr-lg flex justify-start items-center gap-3 cursor-default transition-colors ${
              isBookmarks ? 'bg-white' : ''
            }`}
          >
            <Bookmark
              size={16}
              aria-hidden="true"
              className={`transition-colors ${isBookmarks ? 'text-grey-4' : 'text-grey-2 group-hover:text-grey-3'}`}
              strokeWidth={1.33}
            />
            <span
              className={`text-sm font-semibold font-['Figtree'] leading-6 transition-colors ${
                isBookmarks ? 'text-grey-4' : 'text-grey-2 group-hover:text-grey-3'
              }`}
            >
              Bookmarks
            </span>
          </Link>
        </div>

        {user && (
          <div className="relative mb-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="w-7 h-7 rounded-full bg-grey-1 hover:bg-grey-2 transition-colors flex items-center justify-center cursor-default"
            >
              <span className="text-xs font-semibold text-grey-4 font-['Figtree']">
                {user.email?.[0].toUpperCase() ?? '?'}
              </span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg py-2 z-50"
                style={{
                  boxShadow:
                    '0px 0px 0px 1px rgba(219,219,219,0.50), 0px 1px 2px 0px rgba(44,41,41,0.08), 0px 4px 8px 0px rgba(0,0,0,0.08), 0px 8px 16px 0px rgba(0,0,0,0.04)',
                }}
              >
                {/* Email display */}
                <div className="px-3 py-2 border-b border-grey-05">
                  <p className="text-xs text-grey-2 font-['Figtree']">Signed in as</p>
                  <p className="text-sm font-semibold text-grey-4 font-['Figtree'] truncate">{user.email}</p>
                </div>

                {/* Sign out */}
                <div className="px-2 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-grey-4 font-['Figtree'] hover:bg-grey-05 transition-colors cursor-default"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
