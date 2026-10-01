import fs from 'fs';
import path from 'path';
import { CheckpointData } from '../types.js';

export class CheckpointManager {
  private filePath: string;
  private data: CheckpointData;

  constructor(outputDir: string, filename = 'checkpoint.json') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    this.filePath = path.join(outputDir, filename);
    this.data = this.load();
  }

  private load(): CheckpointData {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        // Fallback to fresh if corrupted
      }
    }
    return {
      lastUpdated: new Date().toISOString(),
      completedPages: [],
      visitedSlugs: [],
      totalSaved: 0,
    };
  }

  public isPageCompleted(page: number): boolean {
    return this.data.completedPages.includes(page);
  }

  public isSlugVisited(slug: string): boolean {
    return this.data.visitedSlugs.includes(slug);
  }

  public markSlugVisited(slug: string): void {
    if (!this.data.visitedSlugs.includes(slug)) {
      this.data.visitedSlugs.push(slug);
    }
  }

  public markPageCompleted(page: number, incrementCount = 0): void {
    if (!this.data.completedPages.includes(page)) {
      this.data.completedPages.push(page);
    }
    this.data.totalSaved += incrementCount;
    this.save();
  }

  public save(): void {
    this.data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public getData(): CheckpointData {
    return this.data;
  }
}
