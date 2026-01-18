// Pagination Component - 分页组件

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
    queryParams?: string;
}

export function Pagination({ currentPage, totalPages, baseUrl, queryParams = '' }: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    const buildUrl = (page: number) => {
        const separator = baseUrl.includes('?') ? '&' : '?';
        const params = queryParams ? `${queryParams}&page=${page}` : `page=${page}`;
        return `${baseUrl}${separator}${params}`;
    };

    // Calculate which page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5; // Show 5 page numbers at a time

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + showPages - 1);

        // Adjust start if we're near the end
        if (end - start < showPages - 1) {
            start = Math.max(1, end - showPages + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push('...');
            }
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div class="pagination">
            {/* Previous button */}
            {currentPage > 1 ? (
                <a href={buildUrl(currentPage - 1)} class="pagination-btn">
                    &laquo; 上一页
                </a>
            ) : (
                <span class="pagination-btn disabled">&laquo; 上一页</span>
            )}

            {/* Page numbers */}
            {pageNumbers.map(page => {
                if (page === '...') {
                    return <span class="pagination-ellipsis">...</span>;
                }

                const pageNum = page as number;
                if (pageNum === currentPage) {
                    return <span class="pagination-num current">{pageNum}</span>;
                }

                return (
                    <a href={buildUrl(pageNum)} class="pagination-num">
                        {pageNum}
                    </a>
                );
            })}

            {/* Next button */}
            {currentPage < totalPages ? (
                <a href={buildUrl(currentPage + 1)} class="pagination-btn">
                    下一页 &raquo;
                </a>
            ) : (
                <span class="pagination-btn disabled">下一页 &raquo;</span>
            )}

            {/* Page info */}
            <span class="pagination-info">
                第 {currentPage} / {totalPages} 页
            </span>
        </div>
    );
}
