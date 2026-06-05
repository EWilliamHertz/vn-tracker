'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Sign in failed');
      } else {
        toast.success('Signed in successfully!');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Sign up failed');
      } else {
        toast.success('Check your email to confirm your account!');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a24] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#23232f] border border-gray-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-8">Sign in or create an account to start reading</p>
        
        <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input 
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full bg-[#15151e] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input 
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full bg-[#15151e] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] outline-none transition-all" 
            />
          </div>
          
          <div className="flex gap-4 mt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white rounded-lg py-3 font-semibold transition-all"
            >
              {isLoading ? 'Signing In...' : 'Log In'}
            </button>
            <button 
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="flex-1 bg-transparent border border-gray-600 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg py-3 font-semibold transition-all"
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
