/**
 * Interface for cursor data containing id and created_at timestamp
 */
export interface CursorData {
  id: string;
  created_at: Date | string;
}

/**
 * Interface for paginated response with cursor
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Encode cursor data to base64 string
 * @param data - Object containing id and created_at
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(data: CursorData): string {
  const cursorObj = {
    id: data.id,
    created_at: data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at,
  };
  return Buffer.from(JSON.stringify(cursorObj)).toString('base64');
}

/**
 * Decode cursor string to cursor data
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor data or null if invalid
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    if (!parsed.id || !parsed.created_at) {
      return null;
    }
    
    return {
      id: parsed.id,
      created_at: parsed.created_at,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Build cursor-based pagination response
 * @param items - Array of items
 * @param limit - Maximum number of items requested
 * @param getCursorData - Function to extract cursor data from an item
 * @returns Paginated response with nextCursor
 */
export function buildCursorResponse<T>(
  items: T[],
  limit: number,
  getCursorData: (item: T) => CursorData,
): CursorPaginatedResponse<T> {
  // If we have more items than the limit, there's a next page
  const hasNextPage = items.length > limit;
  
  // Return only the requested limit of items
  const returnItems = hasNextPage ? items.slice(0, limit) : items;
  
  // Get the last item's cursor for pagination
  const nextCursor = hasNextPage && returnItems.length > 0
    ? encodeCursor(getCursorData(returnItems[returnItems.length - 1]))
    : null;
  
  return {
    items: returnItems,
    nextCursor,
  };
}

