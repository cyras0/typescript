'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface PaginationProps {
  currentPage: number
  totalPages: number
  queryString?: string
  filterString?: string
}

const Pagination = ({ currentPage, totalPages, queryString, filterString }: PaginationProps) => {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (queryString) params.append('query', queryString)
    if (filterString) params.append('filter', filterString)
    params.append('page', page.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="pagination">
      <Link 
        href={getPageUrl(currentPage - 1)}
        className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
        aria-disabled={currentPage === 1}
      >
        <Image src="/assets/icons/arrow-left.svg" alt="Previous" width={16} height={16} />
        Previous
      </Link>

      <div className="pagination-numbers">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Link
            key={page}
            href={getPageUrl(page)}
            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </Link>
        ))}
      </div>

      <Link 
        href={getPageUrl(currentPage + 1)}
        className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
        aria-disabled={currentPage === totalPages}
      >
        Next
        <Image src="/assets/icons/arrow-right.svg" alt="Next" width={16} height={16} />
      </Link>
    </div>
  )
}

export default Pagination