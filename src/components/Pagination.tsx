interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointe text-sm hover:bg-[#FFCD0B] disabled:hover:bg-gray-300"
      >
        Prev
      </button>

      <div className="flex gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNumber;
          if (totalPages <= 5) {
            pageNumber = i + 1;
          } else if (currentPage <= 3) {
            pageNumber = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNumber = totalPages - 4 + i;
          } else {
            pageNumber = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`w-10 h-10 text-sm cursor-pointer ${
                currentPage === pageNumber
                  ? "bg-[#356DB2] text-white"
                  : "bg-gray-300 hover:bg-[#FFCD0B]"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointe text-sm hover:bg-[#FFCD0B] cursor-pointer disabled:hover:bg-gray-300"
      >
        Next
      </button>
    </div>
  );
};
