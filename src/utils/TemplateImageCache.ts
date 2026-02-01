
// Simple in-memory cache for template base64 images
// Persists only during the browser session (page reload clears it)

class TemplateCache {
    private cache: Map<string, string>;

    constructor() {
        this.cache = new Map();
    }

    get(url: string): string | undefined {
        return this.cache.get(url);
    }

    set(url: string, base64: string): void {
        this.cache.set(url, base64);
    }

    has(url: string): boolean {
        return this.cache.has(url);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const templateImageCache = new TemplateCache();
