import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCircle2, Footprints, Heart, HelpCircle, Loader2, Package, Plus, Shirt, Sparkles, Watch, WashingMachine, X } from 'lucide-react';
import { getWardrobe } from '../services/api/wardrobe';
import { getAiOutfitSuggestions, getOutfitSuggestions, getSavedOutfits, saveOutfit, toggleOutfitFavorite } from '../services/api/outfits';
import { useAuth } from '../context/AuthContext';
import { OCCASIONS } from '../constants/categories';
import { PantsIcon } from '../components/common/ClothingIcons';

// Each category links to a pre-filtered wardrobe view (via query params) instead of always
// dropping the user on the unfiltered "all items" page. "Other" covers dresses, sarees, suits,
// and anything else that doesn't fit the other buckets — matched by actual category rather than
// by guessing at subcategory keywords, since subcategory is free text.
const categories = [
  { key: 'TOPS', label: 'Tops', icon: Shirt, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300', href: '/wardrobe?category=TOPS' },
  { key: 'BOTTOMS', label: 'Bottoms', icon: PantsIcon, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300', href: '/wardrobe?category=BOTTOMS' },
  { key: 'OTHER', label: 'Other', icon: Package, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300', href: '/wardrobe?category=OTHER' },
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

// Full-detail view for a suggested outfit. Favoriting is the single action here — there's no
// separate "Save" step. Tapping the heart on an unsaved suggestion saves it (as a favorite) in
// one request; tapping it again just unfavorites it.
function OutfitDetailModal({ outfit, title, onClose, isFavorite, onToggleFavorite, isFavoriting }) {
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
            onClick={onToggleFavorite}
            disabled={isFavoriting}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold disabled:opacity-60 ${isFavorite ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-brand-purple-600 text-white'}`}
          >
            {isFavoriting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />}
            {isFavoriting ? 'Working…' : isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👕</span>
            <div>
              <h3 className="text-lg font-black">How to Use DripLy</h3>
              <p className="text-xs text-slate-400">Get the most out of your digital wardrobe stylist</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </div>
        
        <div className="mt-5 space-y-5">
          <div className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-purple-100 text-brand-purple-600 dark:bg-brand-purple-950 dark:text-brand-purple-300 text-sm font-bold">1</span>
            <div>
              <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">Catalog Your Closet</strong>
              <p className="mt-0.5 text-xs text-slate-500">Click "+ Add clothes" (or the plus button on mobile). Take a photo, and the AI will auto-identify category, colors, pattern, fabric, and occasions!</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-purple-100 text-brand-purple-600 dark:bg-brand-purple-950 dark:text-brand-purple-300 text-sm font-bold">2</span>
            <div>
              <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">Manage Laundry Status</strong>
              <p className="mt-0.5 text-xs text-slate-500">Go to the "Laundry" page to toggle items as clean (Available) or dirty (Dirty). DripLy will only suggest outfits using your clean clothes!</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-purple-100 text-brand-purple-600 dark:bg-brand-purple-950 dark:text-brand-purple-300 text-sm font-bold">3</span>
            <div>
              <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">Get AI Outfit Matches</strong>
              <p className="mt-0.5 text-xs text-slate-500">Type a query in the "Ask DripLy" search bar (e.g. "something cozy for a rainy day") to get personalized recommendations tailored to your goals.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-purple-100 text-brand-purple-600 dark:bg-brand-purple-950 dark:text-brand-purple-300 text-sm font-bold">4</span>
            <div>
              <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">Save Your Favorites</strong>
              <p className="mt-0.5 text-xs text-slate-500">Click the heart icon on any suggested outfit to save it to your Favorites tab. Revisit your favorite looks anytime.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-purple-100 text-brand-purple-600 dark:bg-brand-purple-950 dark:text-brand-purple-300 text-sm font-bold">5</span>
            <div>
              <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">Customize Style Profile</strong>
              <p className="mt-0.5 text-xs text-slate-500">Go to "Settings" to enter your body shape, height, and gender. The AI Stylist uses these parameters to tailor matches specifically to your fit!</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-brand-purple-600 py-3 text-sm font-bold text-white hover:bg-brand-purple-700 transition"
        >
          Got it, let's go!
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [lastSeenDirtyCount, setLastSeenDirtyCount] = React.useState(0);
  const [ask, setAsk] = React.useState('');
  const [occasion, setOccasion] = React.useState('CASUAL');
  const [openOutfitIndex, setOpenOutfitIndex] = React.useState(null);
  const [showGuide, setShowGuide] = React.useState(false);

  React.useEffect(() => {
    const hasSeenGuide = localStorage.getItem('driply-guide-seen');
    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem('driply-guide-seen', 'true');
    }
  }, []);
  // Keyed by suggestion index → { id, isFavorite }. Tracking the real saved outfit id (not
  // just a favorited/not boolean) is what lets a suggestion be un-favorited without a page
  // reload, and lets favoriting an unsaved suggestion save it first, in one action.
  const [savedOutfits, setSavedOutfits] = React.useState({});
  const [favoritingIndex, setFavoritingIndex] = React.useState(null);

  const { data: wardrobeData, isLoading } = useQuery({ queryKey: ['wardrobe', 'dashboard'], queryFn: () => getWardrobe({ limit: 100 }) });
  const { data: outfitsData, isLoading: outfitsLoading } = useQuery({ queryKey: ['outfits', occasion], queryFn: () => getOutfitSuggestions({ occasion, limit: 5 }) });
  // Used both to detect when a suggestion on screen is already favorited (possibly from an
  // earlier session) and to derive the Favorites stat below — one request instead of two,
  // since every saved outfit is a favorite now that there's no separate "My outfits" list.
  const { data: allSavedOutfitsData } = useQuery({ queryKey: ['saved-outfits', 'for-matching'], queryFn: () => getSavedOutfits({ limit: 100, favoritesOnly: true }) });

  const items = wardrobeData?.data || [];
  const total = wardrobeData?.pagination?.total || 0;
  const available = items.filter((item) => item.laundryStatus === 'AVAILABLE').length;
  const dirty = items.filter((item) => item.laundryStatus === 'DIRTY').length;
  // Server truth, with any in-flight/optimistic local changes layered on top — this is what
  // lets the stat update the instant you tap a heart instead of waiting for a refetch.
  const serverSavedOutfits = allSavedOutfitsData?.data || [];
  const serverTotalFavorites = allSavedOutfitsData?.pagination?.total || 0;

  let countAdjustment = 0;
  Object.values(savedOutfits).forEach((saved) => {
    if (!saved) return;
    if (saved.isFavorite && !serverSavedOutfits.some((o) => o.id === saved.id)) {
      countAdjustment += 1;
    } else if (!saved.isFavorite && serverSavedOutfits.some((o) => o.id === saved.id)) {
      countAdjustment -= 1;
    }
  });
  const favorites = Math.max(0, serverTotalFavorites + countAdjustment);
  const ruleOutfits = outfitsData?.data || [];

  // Optimistic patch of the shared "all saved outfits" cache — this is what the Favorites
  // stat and the already-favorited lookup below are derived from, so patching it directly
  // (instead of waiting for invalidateQueries + a fresh network round trip) is what makes the
  // stat and the button state agree with each other instantly instead of only after switching
  // occasion/page forces a refetch.
  const patchSavedOutfitsCache = (id, patch) => {
    queryClient.setQueryData(['saved-outfits', 'for-matching'], (current) =>
      current && { ...current, data: current.data.map((outfit) => (outfit.id === id ? { ...outfit, ...patch } : outfit)) });
  };

  const saveMutation = useMutation({
    mutationFn: saveOutfit,
    onMutate: (variables) => {
      const previous = savedOutfits[variables.__index];
      setSavedOutfits((current) => ({ ...current, [variables.__index]: { id: `pending-${variables.__index}`, isFavorite: true } }));
      return { previous, index: variables.__index };
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
      queryClient.invalidateQueries({ queryKey: ['account-summary'] });
      setMessage('Added to favorites.');
      setSavedOutfits((current) => ({ ...current, [variables.__index]: { id: response.data.id, isFavorite: true } }));
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (error, variables, context) => {
      setSavedOutfits((current) => {
        const next = { ...current };
        if (context?.previous) next[context.index] = context.previous; else delete next[context.index];
        return next;
      });
    },
    onSettled: () => setFavoritingIndex(null),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => toggleOutfitFavorite(id, isFavorite),
    onMutate: (variables) => {
      const index = Object.keys(savedOutfits).find((key) => savedOutfits[key]?.id === variables.id);
      const previous = index !== undefined ? savedOutfits[index] : undefined;
      if (index !== undefined) setSavedOutfits((current) => ({ ...current, [index]: { ...current[index], isFavorite: variables.isFavorite } }));
      patchSavedOutfitsCache(variables.id, { isFavorite: variables.isFavorite });
      return { previous, index };
    },
    onError: (error, variables, context) => {
      if (context?.index !== undefined) setSavedOutfits((current) => ({ ...current, [context.index]: context.previous }));
      patchSavedOutfitsCache(variables.id, { isFavorite: !variables.isFavorite });
    },
    onSettled: () => {
      setFavoritingIndex(null);
      queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
      queryClient.invalidateQueries({ queryKey: ['account-summary'] });
    },
  });

  const aiMutation = useMutation({ mutationFn: (payload) => getAiOutfitSuggestions(payload) });

  // Reset "ask" results state whenever a fresh AI request goes out, otherwise stale
  // saved/expanded indexes from a previous list of suggestions could linger and mismatch.
  const askDripLy = (event) => {
    event.preventDefault();
    if (!ask.trim()) return;
    setSavedOutfits({});
    aiMutation.mutate({ occasion, prompt: ask.trim() });
  };

  // Switching occasion used to leave whatever AI result was already on screen in place —
  // only the "{occasion} look" label recomputed off the new occasion, while the actual
  // suggested items stayed from the old one. Resetting the AI result here means picking a
  // new occasion always falls back to (or re-requests) suggestions for that occasion.
  const handleOccasionChange = (event) => {
    setOccasion(event.target.value);
    aiMutation.reset();
    setSavedOutfits({});
  };

  const outfits = aiMutation.data?.data ?? ruleOutfits;
  const isAiResult = Boolean(aiMutation.data);
  const isLoadingOutfits = isAiResult ? aiMutation.isPending : outfitsLoading;
  const isFallbackOnly = outfits.length > 0 && outfits.every((outfit) => outfit.fallbackMessage);

  // Same item set (regardless of order) = same outfit, for matching purposes.
  const itemSetKey = (itemIds) => [...itemIds].sort().join('|');
  const savedOutfitLookup = React.useMemo(() => {
    const map = new Map();
    (allSavedOutfitsData?.data || []).forEach((saved) => {
      map.set(itemSetKey(saved.items.map((item) => item.clothingItemId)), { id: saved.id, isFavorite: saved.isFavorite });
    });
    return map;
  }, [allSavedOutfitsData]);

  React.useEffect(() => {
    if (!outfits.length) return;
    setSavedOutfits(() => {
      const next = {};
      outfits.forEach((outfit, index) => {
        const match = savedOutfitLookup.get(itemSetKey(outfit.items.map((item) => item.id)));
        if (match) {
          next[index] = match;
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfits, savedOutfitLookup]);

  React.useEffect(() => {
    if (dirty === 0) {
      setLastSeenDirtyCount(0);
    }
  }, [dirty]);

  // The single action on a suggestion card: not favorited yet → save it (as a favorite) in
  // one request; already favorited → unfavorite it. The heart's fill state flips the instant
  // you tap it (via favoritingIndex driving the spinner) rather than waiting for the full
  // round trip before showing any change.
  const toggleFavorite = (outfit, index) => {
    setFavoritingIndex(index);
    const saved = savedOutfits[index];
    if (saved) {
      favoriteMutation.mutate({ id: saved.id, isFavorite: !saved.isFavorite });
    } else {
      saveMutation.mutate({ occasion, clothingItemIds: outfit.items.map((item) => item.id), aiReason: outfit.aiReason, isFavorite: true, __index: index });
    }
  };


  const count = (key) => items.filter((item) => item.category === key).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const openOutfit = openOutfitIndex !== null ? outfits[openOutfitIndex] : null;

  return (
    <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 lg:px-9">
      <header className="flex items-center justify-between">
        <span className="text-lg font-black lg:hidden">DripLy</span>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setShowGuide(true)}
            aria-label="How it works"
            className="rounded-full p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-900"
            title="How it works"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                setLastSeenDirtyCount(dirty);
              }
            }}
            aria-label="Notifications"
            className="relative rounded-full p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-900"
          >
            <Bell className="h-5 w-5" />
            {dirty > lastSeenDirtyCount && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>

          {showNotifications && (
            <>
              {/* Overlay to close on click outside */}
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />

              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h4 className="font-extrabold text-sm">Notifications</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                </div>
                <div className="mt-3 space-y-3">
                  {dirty > 0 && (
                    <div className="flex gap-2.5 rounded-xl bg-amber-50/50 p-2.5 text-xs text-slate-700 dark:bg-amber-950/20 dark:text-slate-350">
                      <span className="mt-0.5 text-amber-500">⚠️</span>
                      <div>
                        <strong className="block font-black text-amber-700 dark:text-amber-400">Laundry reminder</strong>
                        <p className="mt-0.5">You have {dirty} dirty item{dirty > 1 ? 's' : ''} in your laundry bag. <Link to="/laundry" className="underline font-bold text-brand-purple-600 dark:text-brand-purple-400">Manage laundry</Link></p>
                      </div>
                    </div>
                  )}
                  {favorites > 0 ? (
                    <div className="flex gap-2.5 rounded-xl bg-rose-50/30 p-2.5 text-xs text-slate-700 dark:bg-rose-950/10 dark:text-slate-350">
                      <span className="mt-0.5 text-rose-500">❤️</span>
                      <div>
                        <strong className="block font-black text-rose-700 dark:text-rose-400">Saved Looks</strong>
                        <p className="mt-0.5">You have favorited {favorites} outfit suggestions.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2.5 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      <span className="mt-0.5">💡</span>
                      <div>
                        <strong className="block font-bold">Discover looks</strong>
                        <p className="mt-0.5">Try adding items to your favorites to access them quickly.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2.5 rounded-xl bg-emerald-50/30 p-2.5 text-xs text-slate-700 dark:bg-emerald-950/10 dark:text-slate-350">
                    <span className="mt-0.5 text-emerald-500">✨</span>
                    <div>
                      <strong className="block font-black text-emerald-700 dark:text-emerald-400">Welcome to DripLy</strong>
                      <p className="mt-0.5">Ask the AI assistant for customized outfit recommendations based on occasion!</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Link to="/profile" className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand-purple-100 font-black text-brand-purple-700 dark:bg-brand-purple-950 dark:text-brand-purple-300">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : user?.name?.[0]?.toUpperCase() || 'D'}
          </Link>
        </div>
      </header>

      <form onSubmit={askDripLy} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <select
          value={occasion}
          onChange={handleOccasionChange}
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
          <p className="mt-2 text-sm text-slate-500">Let's find your perfect outfit for today.</p>
        </div>
        <Link to="/wardrobe/add" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-purple-500/15">
          <Plus className="h-4 w-4" />Add clothes
        </Link>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <Stat icon={Shirt} label="My wardrobe" value={total} caption="Items" tone="bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-950/50 dark:text-brand-purple-300" />
        <Stat icon={Sparkles} label="Outfit ideas" value={isFallbackOnly ? 0 : outfits.length} caption={`${occasionLabel(occasion)} suggestions`} tone="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" />
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
                  : outfits[0]?.aiUnavailableReason === 'insufficient_wardrobe'
                    ? 'Add a couple more available pieces so DripLy AI has enough to style with — showing rule-based matches for now.'
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
        {favoriteMutation.isError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{favoriteMutation.error?.response?.data?.error?.message || 'Could not update favorites. Please try again.'}</div>
        )}

        {isLoadingOutfits ? (
          <div className="mt-4 h-52 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        ) : isFallbackOnly ? (
          <div className="mt-4 rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 p-7 dark:border-amber-900 dark:bg-amber-950/20">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <h3 className="mt-3 font-black">No {occasionLabel(occasion).toLowerCase()} pieces yet</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{outfits[0].fallbackMessage}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link to={`/wardrobe?occasion=${occasion}`} className="text-sm font-bold text-brand-purple-700 dark:text-brand-purple-300">Tag existing clothes</Link>
              <Link to="/wardrobe/add" className="text-sm font-bold text-brand-purple-700 dark:text-brand-purple-300">Add new clothing</Link>
            </div>
          </div>
        ) : outfits.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {outfits.map((outfit, index) => (
              <article key={index} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => setOpenOutfitIndex(index)} className="block w-full text-left">
                  <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800">
                    {outfit.items.slice(0, 3).map((item) => <img key={item.id} src={item.imageUrl} alt={item.subcategory} className="aspect-square w-full object-cover" />)}
                  </div>
                  <div className="p-4 pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{outfit.source === 'ai' ? `AI look ${index + 1}` : `${occasionLabel(occasion)} look ${index + 1}`}</h3>
                      {outfit.source === 'ai' && (
                        <span className="rounded-full bg-brand-purple-50 px-2 py-0.5 text-[10px] font-bold text-brand-purple-700 dark:bg-brand-purple-950/40 dark:text-brand-purple-300">
                          ✨ AI styled
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{outfit.aiReason}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 p-4 pt-3">
                  <button
                    onClick={() => toggleFavorite(outfit, index)}
                    disabled={favoritingIndex === index}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-60 ${savedOutfits[index]?.isFavorite ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-brand-purple-600 text-white'}`}
                  >
                    {favoritingIndex === index
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Heart className={`h-4 w-4 ${savedOutfits[index]?.isFavorite ? 'fill-current' : ''}`} />}
                    {favoritingIndex === index ? 'Working…' : savedOutfits[index]?.isFavorite ? 'Favorited' : 'Add to favorites'}
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

      <section className="mt-9 grid items-start gap-6 xl:grid-cols-[1.7fr_.7fr]">
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
        <div className="grid gap-5 self-start">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><WashingMachine className="h-5 w-5 text-brand-purple-600" /><h2 className="font-black">Laundry status</h2></div>
              {dirty > 0 && <Link to="/wardrobe?laundryStatus=DIRTY" className="text-xs font-bold text-brand-purple-600">View dirty</Link>}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/40">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${available + dirty ? (available / (available + dirty)) * 100 : 100}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Clean <b className="ml-1">{available}</b></span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Dirty <b className="ml-1">{dirty}</b></span>
            </div>
          </div>
        </div>
      </section>

      {openOutfit && (
        <OutfitDetailModal
          outfit={openOutfit}
          title={`${openOutfit?.source === 'ai' ? 'AI look' : `${occasionLabel(occasion)} look`} ${openOutfitIndex + 1}`}
          onClose={() => setOpenOutfitIndex(null)}
          isFavorite={Boolean(savedOutfits[openOutfitIndex]?.isFavorite)}
          isFavoriting={favoritingIndex === openOutfitIndex}
          onToggleFavorite={() => toggleFavorite(openOutfit, openOutfitIndex)}
        />
      )}

      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
