import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ICONS } from '@/constants'
import DropdownList from './DropdownList'

const Header = ({subHeader, title, userImg}: SharedHeaderProps) => {
  return (
    <header className="header">
      <section className="header-container">
        <div className="details">
            {userImg ? (
                <Link href={`/profile/${userImg.split('/').pop()}`}>
                    <Image src={userImg || '/assets/images/dummy.jpg'} alt="user" width={66} height={66} className="rounded-full"/>
                </Link>
            ) : (
                <Link href="/sign-in" className="sign-in-link">
                    <Image src="/assets/icons/google.svg" alt="sign in" width={22} height={22} />
                    <span>Sign in</span>
                </Link>
            )}

            <article>
                <p>{subHeader}</p>
                <h1>{title}</h1>
            </article>
        </div>

        <aside>
            {userImg ? (
                <>
                    <Link href="/upload">
                        <Image src="/assets/icons/upload.svg" alt="upload" width={16} height={16} />
                        <span>Upload a video</span>
                    </Link>
                    <div className="record">
                        <button className="btn-primary">
                            <Image src={ICONS.record} alt="record" width={16} height={16} />
                            <span>Record a video</span>
                        </button>
                    </div>
                </>
            ) : (
                <Link href="/sign-in" className="btn-primary">
                    <Image src="/assets/icons/google.svg" alt="sign in" width={16} height={16} />
                    <span>Sign in to upload</span>
                </Link>
            )}
        </aside>
      </section>

      <section className="search-filter">
        <div className="search">
            <input type="text" placeholder="Search for videos, tags, folders" />
            <Image src="/assets/icons/search.svg" alt="search" width={16} height={16} />
        </div>

        <DropdownList />
      </section>
    </header>
  )
}

export default Header