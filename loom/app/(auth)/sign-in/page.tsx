'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const Page = () => {
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign in...');
      const response = await authClient.signIn.social({
        provider: "google",
      });
      console.log('Sign in response:', response);
      return response;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('Starting email sign in with:', email);
      
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to sign in');
      }

      const { user, session } = await response.json();
      
      // Store session in localStorage
      localStorage.setItem('mockSession', JSON.stringify({ user, session }));
      console.log('Session stored:', { user, session });
      
      // Navigate to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Email sign in error:', error)
    }
  }

  return (
    <main className="sign-in">
      <aside className='testimonial'>
        <div className='description'>
          <section>
            <figure>
              {Array.from({ length: 5}).map((_, index) => (
                <Image src="/assets/icons/star.svg" alt="star" width={20} height={20} key={index}/>
              ))}
            </figure>
            <p>SnapCast makes screen recording easy. From quick walkthroughs to full tutorials, it is fast, smooth, and sharable in seconds</p>
            <article>
              <Image src="/assets/images/jason.png" alt="jason" width={64} height={64} className='rounded-full' />
              <div>
                <h2>Jason Rivera</h2>
                <p>Product Designer, Google</p>
              </div>
            </article>
          </section>
        </div>
        <p>© SnapCast {(new Date()).getFullYear()}. All rights reserved.</p>
      </aside>
      <aside className='google-sign-in'>
        <section>
          <Link href="/">
            <Image src="/assets/icons/logo.svg" alt="logo" width={40} height={40} />
            <h1>SnapCast</h1>
          </Link>
          <p>Create and share your very first <span>SnapCast video</span> in no time!</p>
          
          {!showEmailInput ? (
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Image src="/assets/icons/google.svg" alt="google" width={22} height={22} />
                <span>Sign in with Google</span>
              </button>
              <button 
                onClick={() => setShowEmailInput(true)}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <span>Continue with Email</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4 w-full max-w-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <span>Continue</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEmailInput(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg border hover:bg-gray-200 transition-colors"
                >
                  <span>Back</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </aside>
      <div className='overlay'/>
    </main>
  )
}

export default Page