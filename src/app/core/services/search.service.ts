import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private _query = signal<string>('');

    get query() {
        return this._query.asReadonly();
    }

    setQuery(value: string) {
        this._query.set(value.toLowerCase().trim());
    }

    clearQuery() {
        this._query.set('');
    }

    /**
     * Reusable filter method
     * @param data Array of items to filter
     * @param searchFields Function that returns an array of strings to search in
     */
    filter<T>(data: T[], searchFields: (item: T) => (string | null | undefined)[]): T[] {
        const q = this._query();
        if (!q) return data;

        return data.filter(item =>
            searchFields(item).some(field =>
                field?.toLowerCase().includes(q)
            )
        );
    }
}
