import React from 'react'
import Header from '../components/header'
import VideoCard from '../components/VideoCard'
import { dummyCards } from '../../constants'


const Page = () => {
  return (
    <main className='wrapper page'>
      <Header title="All Videos" subHeader="Public Library"/>
      <h1 className="text-2xl font-karla">Welcome to LOOM!</h1>
      {dummyCards.map((card) => (
        <VideoCard key={card.id} {...card} />
      ))}
      
    </main>
  )
}

export default Page