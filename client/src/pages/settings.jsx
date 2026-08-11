import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, CheckCircle2, KeyRound, Loader2, LogOut, Save, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword, deleteAccount, uploadAvatar } from '../services/api/auth';

const bodyTypes = ['Petite', 'Straight', 'Pear', 'Hourglass', 'Apple', 'Athletic', 'Other'];

function Field({ label, children }) {
  return (
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'mt-2 w-full rounded-xl border border-slate-250 bg-slate-50 px-3 py-3 font-normal outline-none transition focus:border-brand-purple-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-brand-purple-500';

export default function Settings() {
  const { user, updateProfile, setAuthenticatedUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state for forms
  const [form, setForm] = useState({ name: '', gender: '', heightCm: '', weightKg: '', bodyType: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // UX states
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Hydrate form on mount or user change
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        gender: user.gender || '',
        heightCm: user.heightCm || '',
        weightKg: user.weightKg || '',
        bodyType: user.bodyType || '',
      });
    }
  }, [user]);

  const setFormValue = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const notify = (text) => {
    setMessage(text);
    setError('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        ...form,
        gender: form.gender || null,
        bodyType: form.bodyType || null,
        heightCm: form.heightCm === '' ? null : Number(form.heightCm),
        weightKg: form.weightKg === '' ? null : Number(form.weightKg),
      });
      await queryClient.invalidateQueries({ queryKey: ['account-summary'] });
      notify('Your style profile has been updated.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const selectAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your avatar.');
      return;
    }
    const data = new FormData();
    data.append('avatar', file);
    setAvatarLoading(true);
    try {
      const response = await uploadAvatar(data);
      if (response.data?.user) {
        setAuthenticatedUser(response.data.user);
        notify('Profile photo updated.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not update your photo.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setPasswordLoading(true);
    setError('');
    try {
      await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteAccount({ confirmEmail });
      await logout();
      navigate('/signup', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not delete account.');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const initials = user?.name?.[0]?.toUpperCase() || 'D';

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-7 lg:px-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-purple-600">PREFERENCES & CONTROLS</p>
          <h1 className="mt-1 text-3xl font-black">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account profile, avatar, security settings, and data.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </header>

      {/* Alert banner */}
      {(message || error) && (
        <div
          className={`mt-5 flex gap-2 rounded-xl p-3 text-sm ${
            error
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
          }`}
        >
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {error || message}
        </div>
      )}

      {/* Edit Profile details */}
      <section className="mt-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-purple-100 to-brand-pink-100 text-3xl font-black text-brand-purple-700 dark:from-brand-purple-950 dark:to-brand-pink-950 dark:text-brand-purple-300">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
            <label className="absolute inset-0 grid cursor-pointer place-items-center bg-slate-950/45 text-white opacity-0 transition hover:opacity-100">
              <Camera className="h-5 w-5" />
              <input type="file" accept="image/*" className="hidden" onChange={selectAvatar} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-black">{user?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            <p className="mt-2 text-xs font-semibold text-brand-purple-600">
              {avatarLoading ? 'Uploading photo…' : 'Hover / tap photo to change it'}
            </p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-7 border-t border-slate-100 pt-7 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand-purple-600" />
            <h2 className="font-black">Edit Style Profile</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Update your style profile to customize DripLy outfit suggestions.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                name="name"
                required
                minLength="2"
                value={form.name}
                onChange={setFormValue}
                className={inputClass}
              />
            </Field>
            <Field label="Gender">
              <select name="gender" value={form.gender} onChange={setFormValue} className={inputClass}>
                <option value="">Prefer not to say</option>
                <option>Woman</option>
                <option>Man</option>
                <option>Non-binary</option>
                <option>Prefer to self-describe</option>
              </select>
            </Field>
            <Field label="Height (cm)">
              <input
                name="heightCm"
                type="number"
                min="1"
                max="300"
                value={form.heightCm}
                onChange={setFormValue}
                className={inputClass}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                name="weightKg"
                type="number"
                min="1"
                max="500"
                value={form.weightKg}
                onChange={setFormValue}
                className={inputClass}
              />
            </Field>
            <Field label="Body type">
              <select name="bodyType" value={form.bodyType} onChange={setFormValue} className={inputClass}>
                <option value="">Prefer not to say</option>
                {bodyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </Field>
          </div>

          <button
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      {/* Security & Danger zone */}
      <section className="mt-7 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submitPassword}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-purple-600" />
            <h2 className="font-black">Change Password</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            You’ll be signed out after changing your password.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Current password">
              <input
                type="password"
                value={password.currentPassword}
                onChange={(event) =>
                  setPassword((value) => ({ ...value, currentPassword: event.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                value={password.newPassword}
                onChange={(event) => setPassword((value) => ({ ...value, newPassword: event.target.value }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                value={password.confirmPassword}
                onChange={(event) =>
                  setPassword((value) => ({ ...value, confirmPassword: event.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
          </div>

          <button
            disabled={passwordLoading}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {passwordLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <div className="rounded-3xl border border-rose-100 bg-rose-50/30 p-6 dark:border-rose-900/40 dark:bg-rose-950/15">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <h2 className="font-black text-rose-700 dark:text-rose-400">Danger Zone</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-350">
            Permanently delete your account and all associated wardrobe data. This action is irreversible.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900 dark:hover:bg-rose-950/20"
          >
            <Trash2 className="h-4.5 w-4.5" />
            Delete my account
          </button>
        </div>
      </section>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-black">Delete account?</h2>
            <p className="mt-2 text-sm text-slate-500">
              This permanently removes your wardrobe, saved outfits, and profile. Type <b>{user?.email}</b> to confirm.
            </p>
            <input
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder="Your email address"
              className={inputClass}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={deleting || confirmEmail.toLowerCase() !== user?.email?.toLowerCase()}
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-40"
              >
                {deleting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
