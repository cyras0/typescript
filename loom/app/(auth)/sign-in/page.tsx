'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

const Page = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (!response.ok) {
        throw new Error('Sign in failed')
      }

      const data = await response.json()
      
      // Store session in localStorage
      localStorage.setItem('session', JSON.stringify(data))
      
      // Set cookie with proper attributes
      document.cookie = `session=${JSON.stringify(data)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
      
      // Redirect to profile page instead of home
      window.location.href = `/profile/${data.user.id}`
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
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
         
         {/* Google Sign In Button */}
         <button onClick={handleGoogleSignIn}>
          <Image src="/assets/icons/google.svg" alt="google" width={22} height={22} />
          <span>Sign in with Google</span>
         </button>

         <div className="divider">
           <span>or</span>
         </div>

         {/* Email Sign In Form */}
         <form onSubmit={handleEmailSignIn} className="email-sign-in">
           <input
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             placeholder="Enter your email"
             required
           />
           <button 
             type="submit" 
             disabled={isLoading}
           >
             {isLoading ? 'Signing in...' : 'Sign in with Email'}
           </button>
         </form>
        </section>
      </aside>
      <div className='overlay'/>
    </main>
  )
}

export default Page