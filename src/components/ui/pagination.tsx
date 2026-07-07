'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  onPageChange?: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
}: PaginationProps) {
  const searchParams = useSearchParams();

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const pageNumbers = [];
  const maxVisible = 5;
  const halfVisible = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link href={getPageUrl(currentPage - 1)} onClick={() => handlePageChange(currentPage - 1)}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" disabled>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* First page + ellipsis */}
      {startPage > 1 && (
        <>
          <Link href={getPageUrl(1)} onClick={() => handlePageChange(1)}>
            <Button variant="outline" size="sm">
              1
            </Button>
          </Link>
          {startPage > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map((page) => (
        <Link
          key={page}
          href={getPageUrl(page)}
          onClick={() => handlePageChange(page)}
        >
          <Button
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
          >
            {page}
          </Button>
        </Link>
      ))}

      {/* Last page + ellipsis */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
          <Link href={getPageUrl(totalPages)} onClick={() => handlePageChange(totalPages)}>
            <Button variant="outline" size="sm">
              {totalPages}
            </Button>
          </Link>
        </>
      )}

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link href={getPageUrl(currentPage + 1)} onClick={() => handlePageChange(currentPage + 1)}>
          <Button variant="outline" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" disabled>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
