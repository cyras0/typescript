import React from 'react'

const page = ({params}: {params: {id: string}}) => {
    console.log(params.id);
    const {id} = params;
  return (
    <div>
        <h1 className="text-3xl">User Profile {id}</h1>

    </div>
  )
}

export default page
