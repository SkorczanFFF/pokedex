import { useTranslation } from "react-i18next";
import { GHOST } from "@/components/buttons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrefetch?: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onPrefetch,
}: PaginationProps) => {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const handlePrefetch = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPrefetch?.(page);
  };

  return (
    <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        onMouseEnter={() => handlePrefetch(currentPage - 1)}
        disabled={currentPage === 1}
        className={GHOST}
      >
        {t("pagination.prev")}
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

          const isActive = currentPage === pageNumber;

          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              onMouseEnter={() => handlePrefetch(pageNumber)}
              aria-current={isActive ? "page" : undefined}
              className={`w-10 h-10 text-sm cursor-pointer ${
                isActive
                  ? "bg-dex-blue text-white"
                  : "bg-gray-300 hover:bg-dex-yellow"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        onMouseEnter={() => handlePrefetch(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={GHOST}
      >
        {t("pagination.next")}
      </button>
    </div>
  );
};
