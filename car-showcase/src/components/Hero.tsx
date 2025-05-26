'use client'

import React from 'react'
import CustomButton from './CustomButton'

const Hero = () => {
  const handleScroll = () => {
    // Add scroll functionality here
  }

  return (
    <div className="hero">
        <div className="flex-1 pt-36 px-4 sm:px-16 bg-white">
            {/* h1 represents the main heading of a section/page - used for the most important heading */}
            {/* This h1 has hero__title class which styles it as a large, bold title */}
            <h1 className="hero__title">
                Find, book, or rent a car -- quickly and easily!
            </h1>

            {/* <p> is for paragraphs - used for regular text content */}
            {/* This p tag has hero__subtitle class which styles it as a subtitle */}
            <p className="hero__subtitle">
                Streamline your car rental experience with our effortless booking process.
            </p>

            <CustomButton
                title="Explore Cars"
                containerStyles="bg-primary-blue text-white rounded-full mt-10"
                handleClick={handleScroll}
            />
        </div>
    </div>
  )
}

export default Hero