export class StorageUtils {
  private static MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit to be safe
  private static COMPRESSION_QUALITY = 0.7; // 70% quality for good balance

  /**
   * Compress an image to reduce storage size
   */
  static compressImage(imageData: string, maxSizeKB: number = 500): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[COMPRESS] Starting compression. Input size:', this.getDataSizeKB(imageData), 'KB, target:', maxSizeKB, 'KB');
        console.log('[COMPRESS] Image data format:', {
          startsWithData: imageData.startsWith('data:'),
          hasComma: imageData.includes(','),
          prefix: imageData.substring(0, 50)
        });

        if (!imageData) {
          console.error('[COMPRESS ERROR] No image data provided');
          reject(new Error('No image data provided'));
          return;
        }

        // Normalize to data URL format if raw base64
        let normalizedData = imageData;
        if (!imageData.includes(',')) {
          console.log('[COMPRESS] Converting raw base64 to data URL format');
          // Assume JPEG if no MIME type specified (most compressed images are JPEG)
          normalizedData = `data:image/jpeg;base64,${imageData}`;
        }

        const img = new Image();
        img.onload = () => {
          console.log('[COMPRESS] Image loaded successfully. Dimensions:', img.width, 'x', img.height);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            console.error('[COMPRESS ERROR] Failed to get canvas 2d context');
            reject(new Error('Cannot get canvas context'));
            return;
          }

          // Calculate new dimensions (max 800px width/height for storage efficiency)
          const maxDimension = 800;
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels until we get under target size
          let quality = this.COMPRESSION_QUALITY;
          let compressedData = canvas.toDataURL('image/jpeg', quality);

          while (this.getDataSizeKB(compressedData) > maxSizeKB && quality > 0.1) {
            quality -= 0.1;
            compressedData = canvas.toDataURL('image/jpeg', quality);
          }

          console.log(`Image compressed: ${this.getDataSizeKB(imageData)}KB -> ${this.getDataSizeKB(compressedData)}KB`);
          resolve(compressedData);
        };

        img.onerror = (event) => {
          console.error('[COMPRESS ERROR] Image failed to load. Event:', event);
          console.error('[COMPRESS ERROR] Image src preview:', normalizedData.substring(0, 100));
          reject(new Error('Failed to load image for compression'));
        };
        img.src = normalizedData;
      } catch (error) {
        console.error('[COMPRESS ERROR] Exception in compressImage:', error);
        reject(error);
      }
    });
  }

  /**
   * Get the size of a data URL in KB
   */
  static getDataSizeKB(dataUrl: string): number {
    // Base64 encoding increases size by ~33%, so we calculate the actual size
    console.log('[DEBUG] getDataSizeKB called with:', { dataUrl: dataUrl?.substring(0, 50) + '...', hasComma: dataUrl?.includes(','), type: typeof dataUrl });

    // Handle both data URL format (data:image/jpeg;base64,ABC...) and raw base64 (ABC...)
    let base64Data: string;
    if (dataUrl.includes(',')) {
      // Full data URL format
      base64Data = dataUrl.split(',')[1];
    } else {
      // Raw base64 format
      base64Data = dataUrl;
    }

    console.log('[DEBUG] base64Data after split:', { base64Data: base64Data?.substring(0, 50) + '...', isUndefined: base64Data === undefined });
    return Math.round((base64Data.length * 3) / 4 / 1024);
  }

  /**
   * Check if we have enough localStorage quota for new data
   */
  static checkStorageQuota(newDataSize: number): { hasSpace: boolean; currentUsage: number; maxSize: number } {
    const currentUsage = this.getCurrentStorageUsage();
    const maxSize = this.MAX_STORAGE_SIZE;
    const hasSpace = (currentUsage + newDataSize) <= maxSize;

    return { hasSpace, currentUsage, maxSize };
  }

  /**
   * Get current localStorage usage in bytes
   */
  static getCurrentStorageUsage(): number {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  /**
   * Clean up old items to make space
   */
  static cleanupOldData(bytesNeeded: number): boolean {
    console.log('Attempting to clean up old data to free space...');

    // Get all timeline and comparison items with timestamps
    const items: Array<{ key: string; timestamp: string; size: number }> = [];

    for (const key in localStorage) {
      if (key.startsWith('timeline-') || key.startsWith('comparison-')) {
        try {
          const data = JSON.parse(localStorage[key]);
          const timestamp = data.updatedAt || data.timestamp || '1970-01-01';
          const size = localStorage[key].length + key.length;
          items.push({ key, timestamp, size });
        } catch {
          // Invalid data, mark for deletion
          items.push({ key, timestamp: '1970-01-01', size: localStorage[key].length + key.length });
        }
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let freedBytes = 0;
    let deletedCount = 0;

    for (const item of items) {
      if (freedBytes >= bytesNeeded) break;

      console.log(`Removing old item: ${item.key} (${Math.round(item.size / 1024)}KB)`);
      localStorage.removeItem(item.key);
      freedBytes += item.size;
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} items, freed ${Math.round(freedBytes / 1024)}KB`);
    return freedBytes >= bytesNeeded;
  }

  /**
   * Safe localStorage setItem with quota management
   */
  static safeSetItem(key: string, value: string): boolean {
    try {
      const valueSize = value.length + key.length;
      const quotaCheck = this.checkStorageQuota(valueSize);

      if (!quotaCheck.hasSpace) {
        console.log(`Storage quota would be exceeded. Current: ${Math.round(quotaCheck.currentUsage / 1024)}KB, Max: ${Math.round(quotaCheck.maxSize / 1024)}KB, Needed: ${Math.round(valueSize / 1024)}KB`);

        // Try to clean up space
        const bytesNeeded = valueSize - (quotaCheck.maxSize - quotaCheck.currentUsage);
        if (this.cleanupOldData(bytesNeeded)) {
          console.log('Successfully freed space, retrying storage...');
        } else {
          throw new Error('QUOTA_EXCEEDED');
        }
      }

      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof Error && (error.name === 'QuotaExceededError' || error.message === 'QUOTA_EXCEEDED')) {
        console.error('localStorage quota exceeded even after cleanup');
        throw new Error('STORAGE_QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * Get storage usage summary for debugging
   */
  static getStorageSummary(): { totalUsageKB: number; maxSizeKB: number; percentUsed: number; itemCount: number } {
    const totalUsage = this.getCurrentStorageUsage();
    const maxSize = this.MAX_STORAGE_SIZE;
    const percentUsed = Math.round((totalUsage / maxSize) * 100);

    let itemCount = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        itemCount++;
      }
    }

    return {
      totalUsageKB: Math.round(totalUsage / 1024),
      maxSizeKB: Math.round(maxSize / 1024),
      percentUsed,
      itemCount
    };
  }
}