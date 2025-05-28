'use client'

import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import {signOut, signIn} from 'next-auth/react'
import {useSession} from 'next-auth/react'

const Navbar = () => {
    const {data: session} = useSession()
 
    return (
        <header className="px-5 py-3 bg-white shadow-sm font-work-sans">
            <nav className="flex justify-between items-center">
                <Link href="/">
                    <Image src="/logo.png" alt="logo" width={144} height={30} />
                </Link>

                <div className="flex items-center gap-5 text-black">
                    {session?.user ? (
                        <>
                            <Link href="/startup/create">
                                <span>Create Startup</span>         
                            </Link>

                            <button 
                                onClick={() => signOut()}
                                className="hover:text-gray-600"
                            >
                                Sign Out
                            </button>

                            <Link href={`/user/${session.user.id}`}>
                                <span>{session.user.name}</span>
                            </Link>
                        </>
                    ) : (
                        <button 
                            onClick={() => signIn('github')}
                            className="hover:text-gray-600"
                        >
                            Login with GitHub
                        </button>
                    )}
                </div>
            </nav>
        </header>
    )
}

export default Navbar