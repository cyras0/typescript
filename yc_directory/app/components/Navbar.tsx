import Image from "next/image";
import { auth, signOut, signIn } from "../auth";
import NavItem from "./NavItem";

const Navbar = async () => {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full bg-black">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <NavItem href="/">
          <Image src="/logo.png" alt="logo" width={144} height={30} />
        </NavItem>

        <div className="flex items-center gap-6">
          {session && session?.user ? (
            <>
              <NavItem href="/startup/create">
                Create Startup
              </NavItem>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <NavItem type="button">
                  Sign Out
                </NavItem>
              </form>

              <NavItem href={`/user/${session.user.name}`}>
                {session.user.name}
              </NavItem>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <NavItem type="button">
                Login
              </NavItem>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
