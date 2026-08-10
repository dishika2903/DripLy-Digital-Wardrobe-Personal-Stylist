import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Heart, Loader2, Sparkles, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { deleteOutfit, getSavedOutfits, rateOutfit, toggleOutfitFavorite } from '../services/api/outfits';

const errorMessage = (err, fallback) => err?.response?.data?.error?.message || fallback;
const QUERY_KEY = ['saved-outfits', 'favorites'];

export default function Outfits() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: () => getSavedOutfits({ limit: 50, favoritesOnly: true }) });

  // Optimistic remove: the card disappears the instant you tap the button instead of
  // waiting for the request to round-trip and a refetch to land. On failure the previous
  // list is restored and the error banner explains what happened.
  const removeOptimistically = (id) => {
    const previous = queryClient.getQueryData(QUERY_KEY);
    queryClient.setQueryData(QUERY_KEY, (current) => current && { ...current, data: current.data.filter((outfit) => outfit.id !== id) });
    return previous;
  };
  const restore = (previous) => previous && queryClient.setQueryData(QUERY_KEY, previous);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
    queryClient.invalidateQueries({ queryKey: ['account-summary'] });
  };

  // Un-favoriting just unmarks it (it can still be re-favorited later, e.g. if the same
  // outfit is suggested again from the dashboard); deleting removes it for good.
  const unfavorite = useMutation({
    mutationFn: (id) => toggleOutfitFavorite(id, false),
    onMutate: (id) => ({ previous: removeOptimistically(id) }),
    onError: (err, id, context) => restore(context?.previous),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: deleteOutfit,
    onMutate: (id) => ({ previous: removeOptimistically(id) }),
    onError: (err, id, context) => restore(context?.previous),
    onSettled: refresh,
  });
  const rate = useMutation({ mutationFn: ({ id, rating }) => rateOutfit(id, rating), onSuccess: refresh });

  const outfits = data?.data || [];
  const activeError = unfavorite.error || remove.error || rate.error;

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header>
        <p className="text-sm font-bold text-brand-purple-600">FAVORITE LOOKS</p>
        <h1 className="mt-1 text-3xl font-black">Favorites</h1>
        <p className="mt-1 text-sm text-slate-500">The looks you've marked as favorites. Rate AI looks to give future suggestions lightweight personal context.</p>
      </header>

      {activeError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMessage(activeError, 'Something went wrong. Please try again.')}
        </div>
      )}

      {isLoading ? (
        <Loader2 className="mx-auto mt-16 h-7 w-7 animate-spin text-brand-purple-600" />
      ) : outfits.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {outfits.map((outfit) => {
            const isUnfavoritePending = unfavorite.isPending && unfavorite.variables === outfit.id;
            const isRemovePending = remove.isPending && remove.variables === outfit.id;
            const isRatePending = (rating) => rate.isPending && rate.variables?.id === outfit.id && rate.variables?.rating === rating;
            return (
              <article key={outfit.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800">
                  {outfit.items.slice(0, 3).map(({ clothingItem }) => (
                    <img key={clothingItem.id} src={clothingItem.imageUrl} alt={clothingItem.subcategory || clothingItem.category} className="aspect-square w-full object-cover" />
                  ))}
                </div>
                <div className="p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[10px] font-black text-brand-purple-600">{outfit.occasion}</p>
                      <h2 className="font-black">Favorite outfit</h2>
                    </div>
                    <div>
                      <button aria-label="Remove from favorites" disabled={isUnfavoritePending} onClick={() => unfavorite.mutate(outfit.id)} className="rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800">
                        {isUnfavoritePending ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <Heart className="h-5 w-5 fill-current text-rose-500" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{outfit.aiReason}</p>
                  {outfit.aiReason && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="mr-1 text-xs font-bold text-slate-500 dark:text-slate-400">Helpful?</span>
                      <button aria-label="Like suggestion" disabled={isRatePending(1)} onClick={() => rate.mutate({ id: outfit.id, rating: 1 })} className={`rounded-xl p-2 disabled:opacity-50 ${outfit.aiRating === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800'}`}>
                        <ThumbsUp className="h-5 w-5" />
                      </button>
                      <button aria-label="Dislike suggestion" disabled={isRatePending(-1)} onClick={() => rate.mutate({ id: outfit.id, rating: -1 })} className={`rounded-xl p-2 disabled:opacity-50 ${outfit.aiRating === -1 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800'}`}>
                        <ThumbsDown className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {outfit.items.map(({ clothingItem }) => (
                      <span key={clothingItem.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{clothingItem.subcategory || clothingItem.category || 'Wardrobe item'}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Sparkles className="mx-auto h-8 w-8 text-brand-purple-600" />
          <p className="mt-3 font-bold">No favorites yet.</p>
          <p className="mt-1 text-sm text-slate-500">Tap the heart on any outfit suggestion from the dashboard to save it here.</p>
        </div>
      )}
    </div>
  );
}
