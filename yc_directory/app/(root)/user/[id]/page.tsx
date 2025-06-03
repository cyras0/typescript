import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import {AUTHOR_BY_ID_QUERY} from "@/sanity/lib/queries";
import {notFound} from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import UserStartups from "@/app/components/UserStartups";
import { StartupCardSkeleton } from "@/app/components/StartupCard";

export const experimental_ppr = true;

const Page = async ({params}: {params: Promise<{id: string}>}) => {
  const sid = (await params).id;
  const session = await auth();

  const user = await client.fetch(AUTHOR_BY_ID_QUERY, {id: sid});
  if(!user) {
    notFound();
  }

  return (
    <>
        <section className="profile_container">
            <div className="profile_card">
               <div className="profile_title">
                  <h3 className="text-24-black uppercase text-center line-clamp-1">
                    {user.name}
                  </h3>
               </div>

               <Image
                src={user.image}
                alt={user.name}
                width={220}
                height={200}
                className="profile_image"
               />

               <p className="text-30-extrabold text-center line-clamp-1"> 
                @{user?.username}
               </p>
               <p className="mt-1 text-center text-14-normal">{user?.bio}</p>
            </div>

            <div className="flex-1 flex flex-col gap-5 lg:-mt-5">
                <p className="text-30-bold">
                    {session?.id == sid ? "Yours" : "All"} Startups
                </p>

                <ul className="card_grid-sm">
                    <Suspense fallback={<StartupCardSkeleton />}>
                    <UserStartups id={sid} />
                    </Suspense>
                </ul>
            </div>
        </section>

    </>
  );
}

export default Page;