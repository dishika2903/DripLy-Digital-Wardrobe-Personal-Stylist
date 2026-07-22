import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, Footprints, Heart, Plus, Save, Shirt, Sparkles, Watch, WashingMachine, X } from 'lucide-react';
import { getWardrobe } from '../services/api/wardrobe';
import { getAiOutfitSuggestions, getOutfitSuggestions, getSavedOutfits, saveOutfit } from '../services/api/outfits';
import { useAuth } from '../context/AuthContext';
import { OCCASIONS } from '../constants/categories';
import { PantsIcon, DressIcon } from '../components/common/ClothingIcons';

// Each category links to a pre-filtered wardrobe view (via query params) instead of always
// dropping the user on the unfiltered "all items" page. Dresses aren't their own backend
// category (they're OTHER + a subcategory), so that one links through the search filter instead.
const categories = [
  { key: 'TOPS', label: 'Tops', icon: Shirt, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300', href: '/wardrobe?category=TOPS' },
  { key: 'BOTTOMS', label: 'Bottoms', icon: PantsIcon, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300', href: '/wardrobe?category=BOTTOMS' },
  { key: 'DRESSES', label: 'Dresses', icon: DressIcon, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300', href: '/wardrobe?category=OTHER&search=dress' },
  { key: 'FOOTWEAR', label: 'Shoes', icon: Footprints, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300', href: '/wardrobe?category=FOOTWEAR' },
  { key: 'ACCESSORIES', label: 'Accessories', icon: Watch, tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300', href: '/wardrobe?category=ACCESSORIES' },
];

const occasionLabel = (value) => OCCASIONS.find((item) => item.value === value)?.label || 'Casual';

function Stat({ icon: Icon, label, value, caption, tone }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
      <strong className="mt-4 block text-3xl">{value}</strong>
      <span className="mt-1 block text-sm font-bold">{label}</span>
      <small className="text-xs text-slate-400">{caption}</small>
    </div>
  );
}

function WardrobeCard({ item }) {
  return (
    <Link to={`/wardrobe/${item.id}`} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <img src={item.imageUrl} alt={item.subcategory} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="p-3">
        <strong className="block truncate text-sm">{item.subcategory}</strong>
        <small className="mt-1 block text-slate-400">{item.brand || item.category}</small>
      </div>
    </Link>
  );
}

// Full-detail view for a suggested outfit. Previously the suggestion cards had no click
// handler at all, so "opening" one just meant squinting at the cropped 3-photo strip and
// truncated reason text already on the dashboard — there was nowhere else for it to go.
function OutfitDetailModal({ outfit, title, onClose, onSave, isSaving, isSaved }) {
  if (!outfit) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h3 className="text-lg font-black">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-3">
          {outfit.items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
              <img src={item.imageUrl} alt={item.subcategory} className="aspect-square w-full object-cover" />
              <p className="truncate p-2 text-xs font-bold">{item.subcategory}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{outfit.aiReason}</p>
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-600 px-3 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaved ? 'Saved to My Outfits' : isSaving ? 'Saving…' : 'Save this look'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = React.useState('');
  const [ask, setAsk] = React.useState('');
  const [occasion, setOccasion] = React.useState('CASUAL');
  const [openOutfitIndex, setOpenOutfitIndex] = React.useState(null);
  const [savingIndex, setSavingIndex] = React.useState(null);
  const [savedIndexes, setSavedIndexes] = React.useState([]);

  const { data: wardrobeData, isLoading } = useQuery({ queryKey: ['wardrobe', 'dashboard'], queryFn: () => getWardrobe({ limit: 100 }) });
  const { data: outfitsData, isLoading: outfitsLoading } = useQuery({ queryKey: ['outfits', occasion], queryFn: () => getOutfitSuggestions({ occasion, limit: 5 }) });
  const { data: favoriteOutfitsData } = useQuery({ queryKey: ['saved-outfits', 'favorites-count'], queryFn: () => getSavedOutfits({ limit: 1, favoritesOnly: true }) });

  const items = wardrobeData?.data || [];
  const total = wardrobeData?.pagination?.total || 0;
  const ruleOutfits = outfitsData?.data || [];

  const saveMutation = useMutation({
    mutationFn: saveOutfit,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
      setMessage('Outfit saved to My Outfits.');
      setSavedIndexes((current) => [...current, variables.__index]);
      setTimeout(() => setMessage(''), 3000);
    },
    onSettled: () => setSavingIndex(null),
  });

  const aiMutation = useMutation({ mutationFn: (payload) => getAiOutfitSuggestions(payload) });

  // Reset "ask" results state whenever a fresh AI request goes out, otherwise stale
  // saved/expanded indexes from a previous list of suggestions could linger and mismatch.
  const askDripLy = (event) => {
    event.preventDefault();
    if (!ask.trim()) return;
    setSavedIndexes([]);
    aiMutation.mutate({ occasion, prompt: ask.trim() });
  };

  const outfits = aiMutation.data?.data ?? ruleOutfits;
  const isAiResult = Boolean(aiMutation.data);
  const isLoadingOutfits = isAiResult ? aiMutation.isPending : outfitsLoading;

  const saveSuggestion = (outfit, index) => {
    setSavingIndex(index);
    saveMutation.mutate({ occasion, clothingItemIds: outfit.items.map((item) => item.id), aiReason: outfit.aiReason, __index: index });
  };

  const available = items.filter((item) => item.laundryStatus === 'AVAILABLE').length;
  const dirty = items.filter((item) => item.laundryStatus === 'DIRTY').length;
  const favorites = favoriteOutfitsData?.pagination?.total || 0;
  const count = (key) => (key === 'DRESSES' ? items.filter((item) => ['Dress', 'Jumpsuit'].includes(item.subcategory)).length : items.filter((item) => item.category === key).length);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const openOutfit = openOutfitIndex !== null ? outfits[openOutfitIndex] : null;

  return (
    <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 lg:px-9">
      <header className="flex items-center justify-between">
        <span className="text-lg font-black lg:hidden">DripLy</span>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-4">
          <button aria-label="Notifications" className="rounded-full p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-900"><Bell className="h-5 w-5" /></button>
          <Link to="/profile" className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand-purple-100 font-black text-brand-purple-700 dark:bg-brand-purple-950 dark:text-brand-purple-300">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : user?.name?.[0]?.toUpperCase() || 'D'}
          </Link>
        </div>
      </header>

      <form onSubmit={askDripLy} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <select
          value={occasion}
          onChange={(event) => setOccasion(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {OCCASIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <input
          value={ask}
          onChange={(event) => setAsk(event.target.value)}
          placeholder="Ask DripLy — What should I wear today?"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button disabled={!ask.trim() || aiMutation.isPending} className="rounded-xl bg-brand-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:py-0">
          {aiMutation.isPending ? 'Thinking…' : 'Ask DripLy'}
        </button>
      </form>
      {aiMutation.isError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {aiMutation.error?.response?.data?.error?.message || 'DripLy could not answer that just now. Please try again.'}
        </div>
      )}

      <section className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{greeting}, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="mt-2 text-sm text-slate-500">Let’s find your perfect outfit for today.</p>
        </div>
        <Link to="/wardrobe/add" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-purple-500/15">
          <Plus className="h-4 w-4" />Add clothes
        </Link>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <Stat icon={Shirt} label="My wardrobe" value={total} caption="Items" tone="bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-950/50 dark:text-brand-purple-300" />
        <Stat icon={Sparkles} label="Outfit ideas" value={outfits.length} caption={`${occasionLabel(occasion)} suggestions`} tone="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" />
        <Stat icon={Heart} label="Favorites" value={favorites} caption="Favorite looks" tone="bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-300" />
      </section>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Outfit suggestions</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isAiResult
                ? outfits[0]?.source === 'ai'
                  ? 'DripLy AI styled these from your request and available pieces.'
                  : 'DripLy AI was unavailable, so these are matched from your wardrobe using our styling rules.'
                : 'Rule-based looks created from clean pieces you already own.'}
            </p>
          </div>
          <span className="rounded-full bg-brand-purple-50 px-3 py-1 text-xs font-bold text-brand-purple-700 dark:bg-brand-purple-950/50 dark:text-brand-purple-300">{occasionLabel(occasion)}</span>
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />{message}
          </div>
        )}
        {saveMutation.isError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{saveMutation.error?.response?.data?.error?.message || 'Could not save this outfit. Please try again.'}</div>
        )}
        {outfits.find((outfit) => outfit.fallbackMessage)?.fallbackMessage && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{outfits.find((outfit) => outfit.fallbackMessage).fallbackMessage}</div>
        )}

        {isLoadingOutfits ? (
          <div className="mt-4 h-52 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        ) : outfits.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {outfits.map((outfit, index) => (
              <article key={index} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => setOpenOutfitIndex(index)} className="block w-full text-left">
                  <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800">
                    {outfit.items.slice(0, 3).map((item) => <img key={item.id} src={item.imageUrl} alt={item.subcategory} className="aspect-square w-full object-cover" />)}
                  </div>
                  <div className="p-4 pb-0">
                    <h3 className="font-black">{occasionLabel(occasion)} look {index + 1}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{outfit.aiReason}</p>
                  </div>
                </button>
                <div className="p-4 pt-3">
                  <button
                    onClick={() => saveSuggestion(outfit, index)}
                    disabled={savingIndex === index || savedIndexes.includes(index)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savedIndexes.includes(index) ? 'Saved' : savingIndex === index ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-brand-purple-200 bg-gradient-to-r from-brand-purple-50 to-brand-pink-50 p-7 dark:border-brand-purple-900 dark:from-brand-purple-950/25 dark:to-brand-pink-950/20">
            <Sparkles className="h-6 w-6 text-brand-purple-600" />
            <h3 className="mt-3 font-black">Build your first complete look</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Add a top, bottom, and shoes—or a dress and shoes—and mark them available to see real suggestions here.</p>
            <Link to="/wardrobe/add" className="mt-4 inline-block text-sm font-bold text-brand-purple-700 dark:text-brand-purple-300">Add clothing</Link>
          </div>
        )}
      </section>

      <section className="mt-9">
        <div className="flex items-center justify-between"><h2 className="text-xl font-black">Your wardrobe overview</h2><Link to="/wardrobe" className="text-sm font-bold text-brand-purple-600">View all</Link></div>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map(({ icon: Icon, ...category }) => (
            <Link to={category.href} key={category.key} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${category.tone}`}><Icon className="h-5 w-5" /></span>
              <span><strong className="block text-sm">{category.label}</strong><small className="text-xs text-slate-400">{count(category.key)} items</small></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9 grid gap-6 xl:grid-cols-[1.7fr_.7fr]">
        <div>
          <div className="flex items-center justify-between"><h2 className="text-xl font-black">My wardrobe</h2><Link to="/wardrobe" className="text-sm font-bold text-brand-purple-600">View all</Link></div>
          {isLoading ? (
            <p className="mt-5 text-sm text-slate-500">Loading wardrobe…</p>
          ) : items.length ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.slice(0, 8).map((item) => <WardrobeCard key={item.id} item={item} />)}</div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <Shirt className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 font-black">Your wardrobe is empty</h3>
              <Link to="/wardrobe/add" className="mt-3 inline-block text-sm font-bold text-brand-purple-600">Add your first piece</Link>
            </div>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-brand-purple-600" /><h2 className="font-black">Calendar</h2></div>
            <p className="mt-5 text-sm text-slate-500">Plan outfits on specific dates in the upcoming planner.</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2"><WashingMachine className="h-5 w-5 text-brand-purple-600" /><h2 className="font-black">Laundry status</h2></div>
            <div className="mt-5 flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-full border-[10px] border-emerald-400"><strong>{available}</strong></div>
              <div className="space-y-2 text-sm">
                <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />Clean <b className="ml-2">{available}</b></p>
                <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />Dirty <b className="ml-2">{dirty}</b></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {openOutfit && (
        <OutfitDetailModal
          outfit={openOutfit}
          title={`${occasionLabel(occasion)} look ${openOutfitIndex + 1}`}
          onClose={() => setOpenOutfitIndex(null)}
          onSave={() => saveSuggestion(openOutfit, openOutfitIndex)}
          isSaving={savingIndex === openOutfitIndex}
          isSaved={savedIndexes.includes(openOutfitIndex)}
        />
      )}
    </div>
  );
}
