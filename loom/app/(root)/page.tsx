import React from 'react'
import Header from '../components/header'
import VideoCard from '../components/VideoCard'

const Page = () => {
  return (
    <main className='wrapper page'>
      <Header title="All Videos" subHeader="Public Library"/>
      <h1 className="text-2xl font-karla">Welcome to LOOM!</h1>
      <VideoCard 
        id = "1"
        title="SnapChat Message"
        thumbnail="/assets/samples/thumbnail (1).png"
        createdAt={new Date("2025-06-04 12:00:00")}
        userImg="/assets/images/jason.png"
        userName="Jason"
        views={10}
        visibility="public"
        duration={156}
      /> 
    </main>
  )
}

export default Page