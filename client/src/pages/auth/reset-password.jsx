import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPassword } from '../../services/api/auth';
import { Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await resetPassword({ token, password: data.password });
      if (res?.success) {
        setSuccess(true);
      } else {
        setServerError(res?.error?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Failed to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4"
      >
        <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
          Choose a new password
        </h2>
        <p className="mt-2 text-sm text-slate-505 dark:text-slate-400">
          Secure your account with a strong password.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4"
      >
        <div className="glassmorphism py-8 px-6 sm:px-10 rounded-3xl shadow-soft-lg border border-slate-200/50 dark:border-slate-800/50">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center text-emerald-500">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-855 dark:text-slate-200">Password Reset Complete</h3>
              <p className="text-sm text-slate-505 dark:text-slate-400 leading-relaxed">
                Your password has been successfully updated. All other active sessions have been securely terminated.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 hover:from-brand-purple-700 hover:to-brand-pink-600 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-brand-purple-500/10 cursor-pointer"
                >
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {serverError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-widest font-extrabold text-slate-450 dark:text-slate-500 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border ${
                      errors.password ? 'border-rose-400 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800/80'
                    } focus:border-brand-purple-500 focus:ring-1 focus:ring-brand-purple-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-slate-200 text-sm`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 hover:from-brand-purple-700 hover:to-brand-pink-600 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-brand-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Reset Password</span>}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
