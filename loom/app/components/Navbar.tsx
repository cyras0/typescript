"use client";
import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import ImageWithFallback from "./ImageWithFallback";
import { useEffect, useState } from "react";

const Navbar = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    // Check for session in localStorage
    const sessionStr = localStorage.getItem('session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setLocalUser(session.user);
      } catch (e) {
        console.error('Error parsing session:', e);
      }
    }
  }, []);

  // Use either better-auth session or local session
  const user = session?.user || localUser;

  return (
    <header className="navbar">
      <nav>
        <Link href="/">
          <Image src="/assets/icons/logo.svg" alt="SnapCast logo" width={32} height={32} />
          <h1>SnapCast</h1>
        </Link>

        {user ? (
          <figure>
            <button onClick={() => router.push(`/profile/${user.id}`)}>
              <ImageWithFallback
                src={user.image ?? ""}
                alt="User"
                width={36}
                height={36}
                className="rounded-full aspect-square"
              />
            </button>
            <button
              onClick={async () => {
                // Clear both sessions
                localStorage.removeItem('session');
                document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/sign-in");
                    },
                  },
                });
              }}
              className="cursor-pointer"
            >
              <Image
                src="/assets/icons/logout.svg"
                alt="logout"
                width={24}
                height={24}
                className="rotate-180"
              />
            </button>
          </figure>
        ) : (
          <Link href="/sign-in" className="sign-in-button">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;