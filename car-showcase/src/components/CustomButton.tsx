'use client'

import React from 'react'

interface CustomButtonProps {
  title: string;
  containerStyles: string;
  handleClick?: () => void;
}

const CustomButton = ({ title, containerStyles, handleClick }: CustomButtonProps) => {
  return (
    <button
      onClick={handleClick}
      className={`custom-btn ${containerStyles}`}
    >
      {title}
    </button>
  )
}

export default CustomButton