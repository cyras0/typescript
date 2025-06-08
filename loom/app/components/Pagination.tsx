'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  queryParams?: Record<string, string>
}

const Pagination = ({ currentPage, totalPages, baseUrl, queryParams = {} }: PaginationProps) => {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({
      ...queryParams,
      page: page.toString()
    })
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <div className="pagination">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)} className="pagination-link">
          Previous
        </Link>
      )}
      
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      
      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)} className="pagination-link">
          Next
        </Link>
      )}
    </div>
  )
}

export default Pagination