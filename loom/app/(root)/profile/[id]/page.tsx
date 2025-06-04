import React from 'react'
import Header from '../../../components/header'

const Page = async ({ params }: ParamsWithSearch) => {
    const { id } = await params;
  return (
    <div className='wrapper page'>
        <Header subHeader='ilovegators@gmail.com' title="Go Gators JSM" userImg="/assets/images/dummy.jpg" />
        <h1 className="text-2xl font-karla">USER ID:  {id} </h1>          
    </div>
  )
}

export default Page