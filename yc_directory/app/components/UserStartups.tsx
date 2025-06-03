import React from "react"
import { client } from "@/sanity/lib/client";
import {STARTUPS_BY_AUTHOR_QUERY} from "@/sanity/lib/queries";
import StartupCard from "./StartupCard";
import { Startup } from "@/sanity/types";

const UserStartups = async ({id}: {id: string}) => {
    const startups = await client.fetch(STARTUPS_BY_AUTHOR_QUERY, {id});   

    return (
        <>
        {startups.length > 0 ? startups.map((startup: Startup) =>(
            <StartupCard key={startup._id} post={startup} />
        )) : <p>No startups found</p>}
        </>
    );
};
export default UserStartups;