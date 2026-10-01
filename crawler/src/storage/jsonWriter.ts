import fs from 'fs';
import path from 'path';
import { ResearcherProfile } from '../types.js';

export class JsonStorage {
  private filePath: string;
  private profiles: Map<string, ResearcherProfile> = new Map();

  constructor(outputDir: string, filename = 'mentors.json') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    this.filePath = path.join(outputDir, filename);
  }

  public init(resume: boolean): void {
    if (resume && fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: ResearcherProfile[] = JSON.parse(raw);
        for (const item of list) {
          this.profiles.set(item.slug, item);
        }
      } catch {
        // Start fresh
      }
    }
  }

  public appendProfiles(profiles: ResearcherProfile[]): void {
    for (const p of profiles) {
      this.profiles.set(p.slug, p);
    }
    this.save();
  }

  public save(): void {
    const list = Array.from(this.profiles.values());
    fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
  }

  public count(): number {
    return this.profiles.size;
  }
}
