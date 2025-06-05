import React from 'react'
import Header from '../../../components/header'
import { dummyCards } from '../../../../constants'
import VideoCard from '../../../components/VideoCard'

const Page = async ({ params }: ParamsWithSearch) => {
    const { id } = await params;
  return (
    <div className='wrapper page'>
        <Header subHeader='ilovegators@gmail.com' title="Go Gators JSM" userImg="/assets/images/dummy.jpg" />
        <section className="video-grid">
          {dummyCards.map((card) => (
            <VideoCard key={card.id} {...card} />
        ))}         
        </section>
    </div>
  )
}

export default Page