import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getClothingItem, deleteClothingItem } from '../../services/api/wardrobe';
import { COLORS, LAUNDRY_STATUSES } from '../../constants/categories';
import { ArrowLeft, Edit2, Trash2, Calendar, Sparkles, Tag, Shirt, Loader2, AlertCircle, Heart } from 'lucide-react';

export default function ClothingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch Clothing Details
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['clothingItem', id],
    queryFn: async () => {
      const res = await getClothingItem(id);
      return res.data;
    },
    retry: false,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await deleteClothingItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      navigate('/wardrobe');
    },
    onError: (err) => {
      setDeleteError(
        err.response?.data?.error?.message || 'Failed to delete this item. Please try again.'
      );
      setDeleteConfirm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <Loader2 className="h-10 w-10 text-brand-purple-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading clothing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col items-center justify-center p-6">
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 p-6 rounded-3xl border border-rose-200 text-center max-w-sm">
          <AlertCircle className="h-10 w-10 mx-auto text-rose-500 mb-4" />
          <h3 className="font-bold text-lg mb-2">Item Not Found</h3>
          <p className="text-xs mb-6 text-slate-505 dark:text-rose-450/80">
            {error.response?.data?.error?.message || 'We could not load this clothing item.'}
          </p>
          <Link
            to="/wardrobe"
            className="px-6 py-3 bg-brand-purple-650 hover:bg-brand-purple-700 text-white font-bold rounded-2xl transition-all"
          >
            Back to Closet
          </Link>
        </div>
      </div>
    );
  }

  // Find color hex code mapping
  const colorData = COLORS.find((col) => col.value === item.color);
  const statusData = LAUNDRY_STATUSES.find((status) => status.value === item.laundryStatus);

  return (
    <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Toolbar */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Wardrobe</span>
          </Link>
          <div className="flex gap-2">
            <Link
              to={`/wardrobe/edit/${id}`}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-bold text-xs rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 dark:text-rose-450 font-bold text-xs rounded-xl border border-rose-100 dark:border-rose-900/30 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Layer */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-brand-neutral-cardDark p-6 rounded-3xl shadow-soft-lg max-w-sm w-full border border-slate-100 dark:border-slate-800"
            >
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Delete Clothing Item?</h3>
              <p className="text-sm text-slate-505 dark:text-slate-400 mb-6 leading-relaxed">
                This action is permanent and cannot be undone. All references to this item in outfits will be deleted.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-250 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all flex justify-center items-center gap-1"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteError && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{deleteError}</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glassmorphism rounded-3xl p-6 sm:p-10 shadow-soft-lg border border-slate-200/50 dark:border-slate-800/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {/* Left side: Premium Image View Card */}
            <div className="relative aspect-[3/4] bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
              <img src={item.imageUrl} alt={item.subcategory} className="w-full h-full object-cover" />
              {item.isFavorite && (
                <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/90 p-2.5 rounded-full text-rose-550 shadow-sm border border-slate-100/55 dark:border-slate-800/40">
                  <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                </div>
              )}
            </div>

            {/* Right side: Attribute Parameters Display */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="text-left space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-purple-550 dark:text-brand-purple-400">
                    {item.category}
                  </span>
                  <h2 className="text-3xl font-black text-slate-850 dark:text-white mt-1 leading-tight">
                    {item.subcategory}
                  </h2>
                </div>

                {/* Laundry Pill Status */}
                <div>
                  {statusData && (
                    <span
                      className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold border ${statusData.colorClass}`}
                    >
                      {statusData.label}
                    </span>
                  )}
                </div>

                <hr className="border-slate-100 dark:border-slate-800/50 my-4" />

                {/* Technical Specifications */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
                        Color
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-800 block shadow-sm"
                          style={{ background: colorData?.gradient || colorData?.hex }}
                        ></span>
                        <span className="font-semibold text-slate-700 dark:text-slate-250">
                          {colorData?.label || item.color}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shirt className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
                        Fabric & Pattern
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-250 block mt-0.5">
                        {item.pattern.charAt(0) + item.pattern.slice(1).toLowerCase()},{' '}
                        {item.fabric.charAt(0) + item.fabric.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
                        Season
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-250 block mt-0.5">
                        {item.season.charAt(0) + item.season.slice(1).toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
                        Brand
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-250 block mt-0.5">
                        {item.brand || 'No Brand'}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/50 my-4" />

                {/* Occasions display */}
                <div className="space-y-2 text-left">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
                    Style Occasions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.occasionTags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-slate-50 dark:bg-slate-900/35 border border-slate-150 dark:border-slate-800 text-[11px] font-bold text-slate-650 dark:text-slate-350 rounded-lg shadow-sm"
                      >
                        {tag.charAt(0) + tag.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Purchase Date */}
                {item.purchaseDate && (
                  <div className="pt-2 text-left text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Purchased on {new Date(item.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </div>
                )}
              </div>

              {/* Notes textarea display */}
              {item.notes && (
                <div className="bg-slate-50/70 dark:bg-slate-900/15 border border-slate-150 dark:border-slate-800/40 p-4 rounded-2xl text-left text-sm mt-4">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block mb-1">
                    Notes
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-medium italic">
                    "{item.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
