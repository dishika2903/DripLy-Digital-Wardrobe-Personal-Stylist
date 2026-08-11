import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, WashingMachine, Shirt, Check, Loader2, Sparkles } from 'lucide-react';
import { getWardrobe, updateClothingStatus } from '../services/api/wardrobe';
import { CATEGORY_LABELS } from '../constants/categories';

function StatCard({ label, value, caption, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <strong className="mt-2 block text-3xl font-black">{value}</strong>
      <span className="text-xs text-slate-500">{caption}</span>
    </div>
  );
}

export default function Laundry() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'DIRTY'

  // Fetch all items from wardrobe (unpaginated for management page)
  const { data: wardrobeData, isLoading } = useQuery({
    queryKey: ['wardrobe', 'laundry'],
    queryFn: () => getWardrobe({ limit: 100 }),
  });

  const items = wardrobeData?.data || [];

  // Mutations with optimistic updates
  const mutation = useMutation({
    mutationFn: ({ id, laundryStatus }) => updateClothingStatus(id, laundryStatus),
    onMutate: async ({ id, laundryStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['wardrobe'] });
      const previous = queryClient.getQueryData(['wardrobe', 'laundry']);
      
      queryClient.setQueryData(['wardrobe', 'laundry'], (current) => {
        if (!current || !current.data) return current;
        return {
          ...current,
          data: current.data.map((item) =>
            item.id === id ? { ...item, laundryStatus } : item
          ),
        };
      });
      
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wardrobe', 'laundry'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['account-summary'] });
    },
  });

  // Calculate statistics
  const totalItems = items.length;
  const cleanCount = items.filter((item) => item.laundryStatus === 'AVAILABLE').length;
  const dirtyCount = items.filter((item) => item.laundryStatus === 'DIRTY').length;

  // Filter items based on search and status selection
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.subcategory.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.color && item.color.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || item.laundryStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 lg:px-9">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-purple-600">WARDROBE UTILITY</p>
          <h1 className="mt-1 text-3xl font-black">Laundry Manager</h1>
          <p className="mt-1 text-sm text-slate-500">
            Easily update the availability and clean status of your clothes.
          </p>
        </div>
      </header>

      {/* Stats Section */}
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Closet"
          value={totalItems}
          caption="Total tracked pieces"
          icon={Shirt}
          tone="bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-950/45 dark:text-brand-purple-300"
        />
        <StatCard
          label="Available (Clean)"
          value={cleanCount}
          caption="Ready to style & wear"
          icon={Check}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300"
        />
        <StatCard
          label="Dirty"
          value={dirtyCount}
          caption="Needs washing or ironing"
          icon={WashingMachine}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-950/45 dark:text-amber-300"
        />
      </section>

      {/* Control Bar */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by subcategory, color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple-500 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-brand-purple-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="ALL">All Items</option>
            <option value="AVAILABLE">Clean Only</option>
            <option value="DIRTY">Dirty Only</option>
          </select>
        </div>
      </div>

      {/* Grid of Clothing Items */}
      {isLoading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple-500" />
          <p className="text-sm font-medium text-slate-500">Loading your closet...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-16 text-center">
          <Shirt className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-black">No clothing items found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) => {
            const isPending = mutation.isPending && mutation.variables?.id === item.id;
            const currentStatus = isPending ? mutation.variables.laundryStatus : item.laundryStatus;

            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md dark:border-slate-850 dark:bg-slate-900"
              >
                {/* Image Section */}
                <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-950">
                  <img
                    src={item.imageUrl}
                    alt={item.subcategory}
                    className="h-full w-full object-cover"
                  />
                  {/* Status Overlay Badge */}
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm ${
                      currentStatus === 'AVAILABLE'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {currentStatus === 'AVAILABLE' ? 'Clean' : 'Dirty'}
                  </span>
                  
                  {/* In-flight mutation overlay */}
                  {isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <h3 className="truncate text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    {item.subcategory}
                  </h3>
                  
                  {/* Quick Toggle Action Buttons */}
                  <div className="mt-3.5 flex gap-2">
                    <button
                      type="button"
                      disabled={isPending || currentStatus === 'AVAILABLE'}
                      onClick={() => mutation.mutate({ id: item.id, laundryStatus: 'AVAILABLE' })}
                      className={`flex-1 rounded-xl py-1.5 text-[10px] font-bold transition-all ${
                        currentStatus === 'AVAILABLE'
                          ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'border border-slate-200 text-slate-500 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-600 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-emerald-950/20'
                      }`}
                    >
                      Clean
                    </button>
                    <button
                      type="button"
                      disabled={isPending || currentStatus === 'DIRTY'}
                      onClick={() => mutation.mutate({ id: item.id, laundryStatus: 'DIRTY' })}
                      className={`flex-1 rounded-xl py-1.5 text-[10px] font-bold transition-all ${
                        currentStatus === 'DIRTY'
                          ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                          : 'border border-slate-200 text-slate-500 hover:border-amber-500 hover:bg-amber-50/50 hover:text-amber-600 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-amber-950/20'
                      }`}
                    >
                      Dirty
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
