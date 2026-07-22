import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Loader2, Plus, Sparkles, Wand2, X } from 'lucide-react';
import { CATEGORY_MAP, COLORS, FABRICS, LAUNDRY_STATUSES, OCCASIONS, PATTERNS, SEASONS } from '../../constants/categories';
import { classifyClothing, createClothingItem } from '../../services/api/wardrobe';

const categories = Object.keys(CATEGORY_MAP);
const initial = {
  category: 'OTHER',
  subcategory: '',
  color: 'MULTICOLOR',
  pattern: 'OTHER',
  fabric: 'OTHER',
  season: 'ALL_SEASON',
  laundryStatus: 'AVAILABLE',
  brand: '',
  purchaseDate: '',
  notes: '',
};

// Dark-mode-aware select/input styling — the previous version of this form used a plain
// "border p-2" class with no dark: variants, so every dropdown here rendered with a white
// background and dark text even in dark mode.
const controlClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

const Field = ({ label, children, ai }) => (
  <label className={`block text-sm font-bold ${ai ? 'rounded-xl border border-brand-purple-200 bg-brand-purple-50/50 p-2 dark:border-brand-purple-800 dark:bg-brand-purple-950/25' : ''}`}>
    <span className="flex items-center gap-1">{ai && <Sparkles className="h-3.5 w-3.5 text-brand-purple-600" />}{label}</span>
    {children}
  </label>
);

export default function AddClothing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState(initial);
  const [occasionTags, setOccasionTags] = useState(['CASUAL']);
  const [aiFields, setAiFields] = useState([]);
  const [identifying, setIdentifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => {
    setForm((old) => {
      // Changing the category invalidates whatever subcategory was picked from the old list.
      const next = { ...old, [key]: value };
      if (key === 'category') next.subcategory = '';
      return next;
    });
    setAiFields((old) => old.filter((field) => field !== key));
  };

  const toggleOccasion = (value) => {
    setOccasionTags((current) => (current.includes(value) ? current.filter((tag) => tag !== value) : [...current, value]));
  };

  const identify = async (file = imageFile) => {
    if (!file) return;
    setIdentifying(true);
    setError('');
    try {
      const response = await classifyClothing(file);
      const result = response.data;
      setForm((old) => ({ ...old, category: result.category, subcategory: result.subcategory, color: result.color, pattern: result.pattern, fabric: result.fabric, season: result.season }));
      setAiFields(['category', 'subcategory', 'color', 'pattern', 'fabric', 'season']);
      if (result.invalidFields?.length) setError(`Please review ${result.invalidFields.join(', ')} — DripLy used a safe default.`);
    } catch (err) {
      // The AI couldn't identify this item — every field below is still fully editable,
      // including a real subcategory dropdown (Dress, Blazer, and everything else) instead
      // of a free-text box.
      setError(err.response?.data?.error?.message || 'Could not identify this item. You can still complete the form manually below.');
    } finally {
      setIdentifying(false);
    }
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    identify(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!imageFile) return setError('Add a photo first.');
    if (!form.subcategory) return setError('Choose a subcategory (e.g. Dress, Blazer, Jeans).');
    if (!occasionTags.length) return setError('Pick at least one occasion this item works for.');
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('image', imageFile);
      Object.entries(form).forEach(([key, value]) => { if (value) data.append(key, value); });
      occasionTags.forEach((tag) => data.append('occasionTags', tag));
      const response = await createClothingItem(data);
      await queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      navigate(`/wardrobe/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'We could not add this item.');
    } finally {
      setLoading(false);
    }
  };

  const options = (values) => values.map((value) => <option key={value.value || value} value={value.value || value}>{value.label || value.replaceAll('_', ' ')}</option>);
  const subcategoryOptions = CATEGORY_MAP[form.category] || [];

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-purple-600">DIGITAL WARDROBE</p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">Add clothes</h1>
          <p className="mt-2 text-sm text-slate-500">Upload a photo and DripLy will pre-fill details for your review.</p>
        </div>
        <Link to="/wardrobe" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500">Cancel</Link>
      </header>
      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-brand-purple-600" /><h2 className="font-black">Your clothing photo</h2></div>
          <label className="group relative mt-5 flex aspect-[4/5] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-brand-purple-200 bg-brand-purple-50/50 dark:border-brand-purple-800 dark:bg-brand-purple-950/20">
            {preview ? <img src={preview} alt="Clothing preview" className="h-full w-full object-cover" /> : <><Camera className="h-8 w-8 text-brand-purple-600" /><strong className="mt-4">Upload clothing photo</strong></>}
            <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/*" onChange={chooseImage} />
          </label>
          {preview && (
            <div className="mt-3 flex gap-3">
              <button type="button" onClick={() => identify()} disabled={identifying} className="inline-flex items-center gap-1 text-xs font-bold text-brand-purple-600"><Wand2 className="h-4 w-4" />{identifying ? 'Identifying…' : 'Re-identify'}</button>
              <button type="button" onClick={() => { setImageFile(null); setPreview(''); }} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><X className="h-4 w-4" />Remove</button>
            </div>
          )}
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-brand-pink-500" /><h2 className="font-black">Review details</h2></div>
          {identifying && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-brand-purple-600"><Loader2 className="h-4 w-4 animate-spin" />Identifying your item…</p>}
          {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Category" ai={aiFields.includes('category')}>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={controlClass}>{options(categories)}</select>
            </Field>
            <Field label="Subcategory" ai={aiFields.includes('subcategory')}>
              <select value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} className={controlClass}>
                <option value="">Select subcategory</option>
                {options(subcategoryOptions)}
              </select>
            </Field>
            <Field label="Color" ai={aiFields.includes('color')}>
              <select value={form.color} onChange={(e) => set('color', e.target.value)} className={controlClass}>{options(COLORS)}</select>
            </Field>
            <Field label="Pattern" ai={aiFields.includes('pattern')}>
              <select value={form.pattern} onChange={(e) => set('pattern', e.target.value)} className={controlClass}>{options(PATTERNS)}</select>
            </Field>
            <Field label="Fabric" ai={aiFields.includes('fabric')}>
              <select value={form.fabric} onChange={(e) => set('fabric', e.target.value)} className={controlClass}>{options(FABRICS)}</select>
            </Field>
            <Field label="Season" ai={aiFields.includes('season')}>
              <select value={form.season} onChange={(e) => set('season', e.target.value)} className={controlClass}>{options(SEASONS)}</select>
            </Field>
            <Field label="Laundry status">
              <select value={form.laundryStatus} onChange={(e) => set('laundryStatus', e.target.value)} className={controlClass}>{options(LAUNDRY_STATUSES)}</select>
            </Field>
            <Field label="Purchase date">
              <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} className={controlClass} />
            </Field>
            <Field label="Brand"><input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={controlClass} /></Field>
            <Field label="Notes"><input value={form.notes} onChange={(e) => set('notes', e.target.value)} className={controlClass} /></Field>
          </div>
          <div className="mt-4">
            <span className="text-sm font-bold">Occasions</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => {
                const isSelected = occasionTags.includes(occasion.value);
                return (
                  <button
                    key={occasion.value}
                    type="button"
                    onClick={() => toggleOccasion(occasion.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${isSelected ? 'border-transparent bg-gradient-to-tr from-brand-purple-600 to-brand-pink-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {occasion.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-4 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {loading ? 'Adding…' : 'Add to wardrobe'}
          </button>
        </section>
      </form>
    </div>
  );
}
