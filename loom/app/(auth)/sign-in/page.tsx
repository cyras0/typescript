'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const Page = () => {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Store the email in localStorage or sessionStorage
      localStorage.setItem('userEmail', email)
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Sign in error:', error)
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
          <form onSubmit={handleSignIn} className="flex flex-col gap-4 w-full max-w-sm">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <span>Continue with Email</span>
            </button>
          </form>
        </section>
      </aside>
      <div className='overlay'/>
    </main>
  )
}

export default Page