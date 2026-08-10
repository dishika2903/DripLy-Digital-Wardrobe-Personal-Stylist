import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Settings, Shirt, Heart, Calendar, UserRound, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAccountSummary } from '../services/api/auth';

function InfoField({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {value || <span className="italic font-normal text-slate-400">Not provided</span>}
      </p>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ['account-summary'],
    queryFn: getAccountSummary,
  });

  const statValue = (value) => {
    if (summaryLoading) return <Loader2 className="h-5 w-5 animate-spin text-slate-400" />;
    if (summaryError) return <span className="text-sm font-semibold text-rose-500">Error</span>;
    return value;
  };

  const initials = user?.name?.[0]?.toUpperCase() || 'D';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-7 lg:px-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-purple-600">PERSONAL SPACE</p>
          <h1 className="mt-1 text-3xl font-black">Your Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            A summary of your style details, stats, and preferences.
          </p>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02]"
        >
          <Settings className="h-4.5 w-4.5" />
          Edit in Settings
        </Link>
      </header>

      {/* Profile summary card */}
      <section className="mt-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-purple-100 to-brand-pink-100 text-3xl font-black text-brand-purple-700 dark:from-brand-purple-950 dark:to-brand-pink-950 dark:text-brand-purple-300">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black">{user?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Account stats cards */}
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Wardrobe</span>
            <Shirt className="h-5 w-5 text-brand-purple-500" />
          </div>
          <strong className="mt-2 block text-3xl font-black">{statValue(summary?.data?.wardrobeItems)}</strong>
          <span className="text-xs text-slate-500">Items saved in your closet</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Favorites</span>
            <Heart className="h-5 w-5 text-rose-500" />
          </div>
          <strong className="mt-2 block text-3xl font-black">{statValue(summary?.data?.outfits)}</strong>
          <span className="text-xs text-slate-500">Favorite styled looks</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Member Since</span>
            <Calendar className="h-5 w-5 text-emerald-500" />
          </div>
          <strong className="mt-2 block text-xl font-black">
            {statValue(
              summary?.data?.memberSince
                ? new Date(summary.data.memberSince).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })
                : null
            )}
          </strong>
          <span className="text-xs text-slate-500">Your DripLy journey start</span>
        </div>
      </section>

      {/* Style Profile Details */}
      <section className="mt-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <UserRound className="h-5 w-5 text-brand-purple-600" />
          <h2 className="text-lg font-black">Style Profile Summary</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          These settings help personalize DripLy suggestions for you.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Gender" value={user?.gender} />
          <InfoField
            label="Height"
            value={user?.heightCm ? `${user.heightCm} cm` : null}
          />
          <InfoField
            label="Weight"
            value={user?.weightKg ? `${user.weightKg} kg` : null}
          />
          <InfoField label="Body Type" value={user?.bodyType} />
        </div>
      </section>
    </div>
  );
}
