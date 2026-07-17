import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ChevronDown, ImagePlus, Loader2, Plus, Sparkles, Wand2, X } from 'lucide-react';
import { CATEGORY_MAP } from '../../constants/categories';
import { createClothingItem } from '../../services/api/wardrobe';

const clothingTypes = Object.entries(CATEGORY_MAP).flatMap(([category, types]) => types.map((subcategory) => ({ category, subcategory })));

export default function AddClothing() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedType = useMemo(() => clothingTypes.find((entry) => `${entry.category}|${entry.subcategory}` === type), [type]);

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose a JPG, PNG, or other image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Please choose an image smaller than 5 MB.'); return; }
    setError(''); setImageFile(file); setPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!imageFile) { setError('Add a photo of the clothing item first.'); return; }
    setLoading(true); setError('');
    try {
      const data = new FormData();
      data.append('image', imageFile);
      if (selectedType) { data.append('category', selectedType.category); data.append('subcategory', selectedType.subcategory); }
      if (brand.trim()) data.append('brand', brand.trim());
      if (notes.trim()) data.append('notes', notes.trim());
      const response = await createClothingItem(data);
      navigate(`/wardrobe/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'We could not add this item. Please try again after restarting the server.');
    } finally { setLoading(false); }
  };

  return <div className="mx-auto max-w-5xl p-5 sm:p-8"><header className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-brand-purple-600">DIGITAL WARDROBE</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Add clothes</h1><p className="mt-2 text-sm text-slate-500">Upload a photo first. The extra details are optional.</p></div><Link to="/wardrobe" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900">Cancel</Link></header>
    <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><div className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-brand-purple-600" /><h2 className="font-black">Your clothing photo</h2></div><label className="group relative mt-5 flex aspect-[4/5] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-brand-purple-200 bg-brand-purple-50/50 transition hover:border-brand-purple-500 dark:border-brand-purple-900 dark:bg-brand-purple-950/20">{preview ? <><img src={preview} alt="Clothing preview" className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100"><Camera className="mr-2 h-5 w-5" />Change photo</span></> : <><span className="rounded-2xl bg-white p-4 text-brand-purple-600 shadow-sm dark:bg-slate-800"><Camera className="h-8 w-8" /></span><strong className="mt-4">Upload clothing photo</strong><span className="mt-1 text-center text-xs text-slate-500">JPG, PNG or WEBP · up to 5 MB</span></>}<input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/*" onChange={chooseImage} /></label>{preview && <button type="button" onClick={() => { setImageFile(null); setPreview(''); }} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600"><X className="h-4 w-4" />Remove photo</button>}</section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><div className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-brand-pink-500" /><h2 className="font-black">Help us identify it</h2></div><p className="mt-1 text-sm text-slate-500">Choose a type if you know it. Otherwise save now and update it later.</p>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600 dark:bg-rose-950/30">{error}</p>}
        <label className="mt-6 block text-sm font-bold">Clothing type <span className="font-normal text-slate-400">(optional)</span><div className="relative mt-2"><select value={type} onChange={(event) => setType(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800"><option value="">Let DripLy decide later</option>{Object.entries(CATEGORY_MAP).map(([category, types]) => <optgroup key={category} label={category.charAt(0) + category.slice(1).toLowerCase()}>{types.map((subcategory) => <option key={subcategory} value={`${category}|${subcategory}`}>{subcategory}</option>)}</optgroup>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-slate-400" /></div></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Brand <span className="font-normal text-slate-400">(optional)</span><input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="e.g. Zara" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-sm font-bold">Notes <span className="font-normal text-slate-400">(optional)</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything helpful" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800" /></label></div>
        <div className="mt-6 rounded-2xl bg-brand-purple-50 p-4 dark:bg-brand-purple-950/25"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple-600" /><p className="text-sm text-slate-600 dark:text-slate-300"><strong>AI details are coming next.</strong> For now, DripLy saves your photo with safe defaults, so adding an item never gets blocked by colour, pattern, fabric, or occasion fields.</p></div></div>
        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-4 font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}{loading ? 'Adding to wardrobe…' : 'Add to wardrobe'}</button></section></form></div>;
}
