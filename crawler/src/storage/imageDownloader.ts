import fs from 'fs';
import path from 'path';

export class ImageDownloader {
  private imagesDir: string;
  private userAgent: string;

  constructor(outputDir: string, userAgent?: string) {
    this.imagesDir = path.join(outputDir, 'images');
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
    this.userAgent =
      userAgent ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  }

  public getImagesDir(): string {
    return this.imagesDir;
  }

  /**
   * Downloads an image and saves it to the images directory.
   * If already downloaded and not empty, returns true immediately.
   */
  public async download(
    imageUrl: string | undefined,
    filename: string | undefined
  ): Promise<{ success: boolean; localPath?: string }> {
    if (!imageUrl || !filename) {
      return { success: false };
    }

    const targetPath = path.join(this.imagesDir, filename);

    // Skip if already downloaded
    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      if (stats.size > 0) {
        return { success: true, localPath: targetPath };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { success: false };
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return { success: false };
      }

      fs.writeFileSync(targetPath, buffer);
      return { success: true, localPath: targetPath };
    } catch {
      return { success: false };
    }
  }
}
