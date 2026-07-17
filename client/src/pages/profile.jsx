import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Ruler, HeartPulse, Save, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

const bodyTypes = ['Petite', 'Straight', 'Pear', 'Hourglass', 'Apple', 'Athletic', 'Other'];

export default function Profile() {
  const { user, updateProfile, logoutAll } = useAuth();
  const [form, setForm] = useState({ name: '', gender: '', heightCm: '', weightKg: '', bodyType: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', gender: user.gender || '', heightCm: user.heightCm || '', weightKg: user.weightKg || '', bodyType: user.bodyType || '' });
  }, [user]);

  const setValue = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      await updateProfile({ ...form, heightCm: form.heightCm === '' ? null : Number(form.heightCm), weightKg: form.weightKg === '' ? null : Number(form.weightKg), gender: form.gender || null, bodyType: form.bodyType || null });
      setMessage('Style profile saved. We’ll use it to make recommendations more personal.');
    } catch (err) { setError(err.response?.data?.error?.message || 'Could not save your profile. Please try again.'); }
    finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-3xl p-5 sm:p-8"><header><p className="text-sm font-bold text-brand-purple-600">ACCOUNT</p><h1 className="mt-1 text-3xl font-black">Your style profile</h1><p className="mt-2 text-sm text-slate-500">Everything below is optional. It helps DripLy tailor future outfit recommendations.</p></header>
    <form onSubmit={save} className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      {error && <div className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      {message && <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5 shrink-0" />{message}</div>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Name<input name="name" value={form.name} onChange={setValue} required minLength="2" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800" /></label><div className="text-sm font-bold">Email<div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-3 font-normal text-slate-500 dark:bg-slate-800"><Mail className="h-4 w-4" />{user?.email}</div></div></div>
      <div className="border-t border-slate-100 pt-6 dark:border-slate-800"><div className="flex items-center gap-2"><User className="h-5 w-5 text-brand-purple-600" /><h2 className="font-black">Optional fit information</h2></div><p className="mt-1 text-xs text-slate-500">You can add, change, or remove this at any time.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Gender<select name="gender" value={form.gender} onChange={setValue} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800"><option value="">Prefer not to say</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer to self-describe</option></select></label><label className="text-sm font-bold">Body type<select name="bodyType" value={form.bodyType} onChange={setValue} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800"><option value="">Prefer not to say</option>{bodyTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="text-sm font-bold">Height (cm)<input name="heightCm" type="number" min="1" max="300" value={form.heightCm} onChange={setValue} placeholder="e.g. 170" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-sm font-bold">Weight (kg)<input name="weightKg" type="number" min="1" max="500" value={form.weightKg} onChange={setValue} placeholder="e.g. 65" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-brand-purple-500 dark:border-slate-700 dark:bg-slate-800" /></label></div></div>
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save style profile'}</button>
    </form>
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><h2 className="font-black">Security</h2><p className="mt-1 text-sm text-slate-500">Sign out every device if you suspect someone has access to your account.</p></div><button onClick={logoutAll} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 dark:bg-rose-950/30"><Key className="h-4 w-4" />Log out all</button></div></section>
  </div>;
}
