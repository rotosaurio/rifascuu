import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  className = '',
}) => {
  // Create array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end page numbers
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the start
    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages - 1);
    }
    
    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 4);
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;
  
  const pageNumbers = showPageNumbers ? getPageNumbers() : [];
  
  return (
    <nav className={`flex justify-center items-center space-x-2 ${className}`}>
      {/* Previous page button */}
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none
          ${currentPage <= 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
      >
        Anterior
      </button>
      
      {/* Page numbers */}
      {showPageNumbers && pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2">...</span>
          ) : (
            <button
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none
                ${currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      {/* Next page button */}
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none
          ${currentPage >= totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
      >
        Siguiente
      </button>
    </nav>
  );
};

export default Pagination;
