import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getClothingItem, updateClothingItem } from '../../services/api/wardrobe';
import { CATEGORY_MAP, COLORS, FABRICS, PATTERNS, SEASONS, OCCASIONS, LAUNDRY_STATUSES } from '../../constants/categories';
import { Sparkles, Camera, ArrowLeft, Loader2, AlertCircle, Check } from 'lucide-react';

const formSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  color: z.string().min(1, 'Color is required'),
  fabric: z.string().min(1, 'Fabric is required'),
  pattern: z.string().min(1, 'Pattern is required'),
  season: z.string().min(1, 'Season is required'),
  brand: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  laundryStatus: z.string().default('AVAILABLE'),
});

export default function EditClothing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const selectedCategory = watch('category');

  // Query existing item details
  const { data: itemData, isLoading: fetchLoading, error: fetchError } = useQuery({
    queryKey: ['clothingItem', id],
    queryFn: async () => {
      const res = await getClothingItem(id);
      return res.data;
    },
    retry: false,
  });

  // Prepopulate form when data loads
  useEffect(() => {
    if (itemData) {
      reset({
        category: itemData.category,
        subcategory: itemData.subcategory,
        color: itemData.color,
        fabric: itemData.fabric,
        pattern: itemData.pattern,
        season: itemData.season,
        brand: itemData.brand || '',
        purchaseDate: itemData.purchaseDate ? itemData.purchaseDate.split('T')[0] : '',
        notes: itemData.notes || '',
        laundryStatus: itemData.laundryStatus,
      });
      setSelectedColor(itemData.color);
      setSelectedOccasions(itemData.occasionTags || []);
      setImagePreview(itemData.imageUrl);
    }
  }, [itemData, reset]);

  // Handle Image File Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setServerError('Please select a valid image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOccasionToggle = (val) => {
    if (selectedOccasions.includes(val)) {
      setSelectedOccasions(selectedOccasions.filter((item) => item !== val));
    } else {
      setSelectedOccasions([...selectedOccasions, val]);
    }
  };

  const selectColor = (colorVal) => {
    setSelectedColor(colorVal);
    setValue('color', colorVal, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    if (selectedOccasions.length === 0) {
      setServerError('Please select at least one occasion tag');
      return;
    }

    setSubmitLoading(true);
    setServerError('');

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('category', data.category);
      formData.append('subcategory', data.subcategory);
      formData.append('color', data.color);
      formData.append('fabric', data.fabric);
      formData.append('pattern', data.pattern);
      formData.append('season', data.season);
      formData.append('laundryStatus', data.laundryStatus);

      formData.append('brand', data.brand || '');
      formData.append('purchaseDate', data.purchaseDate || '');
      formData.append('notes', data.notes || '');

      selectedOccasions.forEach((tag) => {
        formData.append('occasionTags', tag);
      });

      const res = await updateClothingItem(id, formData);
      if (res?.success) {
        await queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        await queryClient.invalidateQueries({ queryKey: ['clothingItem', id] });
        navigate(`/wardrobe/${id}`);
      } else {
        setServerError(res?.error?.message || 'Failed to update clothing item.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'An error occurred while updating. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-brand-purple-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading clothing details...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col items-center justify-center p-6">
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 p-6 rounded-3xl border border-rose-200 text-center max-w-sm">
          <AlertCircle className="h-10 w-10 mx-auto text-rose-500 mb-4" />
          <h3 className="font-bold text-lg mb-2">Error Loading Item</h3>
          <p className="text-xs mb-6 text-slate-505 dark:text-rose-400/80">
            {fetchError.response?.data?.error?.message || 'We could not find the clothing item requested.'}
          </p>
          <Link
            to="/profile"
            className="px-6 py-3 bg-brand-purple-650 hover:bg-brand-purple-700 text-white font-bold rounded-2xl transition-all"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to={`/wardrobe/${id}`}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Details</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-brand-purple-500" />
            <span className="font-bold text-sm bg-gradient-to-r from-brand-purple-650 to-brand-pink-500 bg-clip-text text-transparent">
              Edit Clothing
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-3xl p-6 sm:p-10 shadow-soft-lg border border-slate-200/50 dark:border-slate-800/50"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {serverError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left Column: Image Selector */}
              <div className="md:col-span-2 flex flex-col items-center">
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-3 w-full text-left">
                  Clothing Image
                </label>
                <div className="relative w-full aspect-[3/4] bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col items-center justify-center group hover:border-brand-purple-400 transition-all">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-white text-xs font-bold flex items-center gap-1 bg-black/50 px-3 py-2 rounded-xl">
                          <Camera className="h-4 w-4" /> Change Image
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                        <Camera className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500">No Image Available</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Column: Attribute Selectors */}
              <div className="md:col-span-3 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Category
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-800 dark:text-slate-200 text-sm"
                    >
                      <option value="">Select Category</option>
                      {Object.keys(CATEGORY_MAP).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.category.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Subcategory
                    </label>
                    <select
                      {...register('subcategory')}
                      disabled={!selectedCategory}
                      className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-800 dark:text-slate-200 text-sm disabled:opacity-50"
                    >
                      <option value="">Select Subcategory</option>
                      {selectedCategory &&
                        CATEGORY_MAP[selectedCategory]?.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                    {errors.subcategory && <p className="mt-1 text-xs text-rose-505 font-medium">{errors.subcategory.message}</p>}
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-3">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => selectColor(col.value)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center relative shadow-sm border transition-all ${
                          selectedColor === col.value
                            ? 'scale-110 ring-2 ring-brand-purple-500 border-transparent'
                            : 'border-slate-200 dark:border-slate-850 hover:scale-105'
                        }`}
                        style={{ background: col.gradient || col.hex }}
                        title={col.label}
                      >
                        {selectedColor === col.value && (
                          <Check className={`h-4.5 w-4.5 ${col.value === 'WHITE' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.color && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.color.message}</p>}
                </div>

                {/* Fabric, Pattern, Season */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Fabric
                    </label>
                    <select
                      {...register('fabric')}
                      className="w-full px-3 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="">Fabric</option>
                      {FABRICS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    {errors.fabric && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.fabric.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Pattern
                    </label>
                    <select
                      {...register('pattern')}
                      className="w-full px-3 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="">Pattern</option>
                      {PATTERNS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {errors.pattern && <p className="mt-1 text-xs text-rose-505 font-medium">{errors.pattern.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Season
                    </label>
                    <select
                      {...register('season')}
                      className="w-full px-3 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="">Season</option>
                      {SEASONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {errors.season && <p className="mt-1 text-xs text-rose-505 font-medium">{errors.season.message}</p>}
                  </div>
                </div>

                {/* Brand & Purchase Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      placeholder="Zara, Levi's..."
                      {...register('brand')}
                      className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-805 dark:text-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      {...register('purchaseDate')}
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-805 dark:text-slate-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Occasion Tags */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6">
              <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-3 text-left">
                Occasions
              </label>
              <div className="flex flex-wrap gap-2 justify-start">
                {OCCASIONS.map((occ) => {
                  const isSelected = selectedOccasions.includes(occ.value);
                  return (
                    <button
                      key={occ.value}
                      type="button"
                      onClick={() => handleOccasionToggle(occ.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-tr from-brand-purple-600 to-brand-pink-500 text-white border-transparent shadow-sm'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {occ.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Laundry status and notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2 text-left">
                  Laundry Status
                </label>
                <select
                  {...register('laundryStatus')}
                  className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-800 dark:text-slate-200 text-sm"
                >
                  {LAUNDRY_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2 text-left">
                  Additional Notes
                </label>
                <input
                  type="text"
                  placeholder="Fits oversized, vintage find..."
                  {...register('notes')}
                  className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 focus:border-brand-purple-500 rounded-2xl outline-none text-slate-805 dark:text-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-6">
              <Link
                to={`/wardrobe/${id}`}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-250 font-bold rounded-2xl text-center transition-all border border-slate-250/20 dark:border-slate-700/30 text-sm cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-[2] py-4 bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 hover:from-brand-purple-700 hover:to-brand-pink-600 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-brand-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Save Changes</span>
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
