import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  CharacterDetail,
  CharacterListItem,
  Paginated,
  PlanetDetail,
  PlanetListItem
} from '../models/dragonball.types';

function normalizePaginated<T>(data: unknown): Paginated<T> {
  if (Array.isArray(data)) {
    const items = data as T[];
    const n = items.length;
    return {
      items,
      meta: {
        totalItems: n,
        itemCount: n,
        itemsPerPage: n || 1,
        totalPages: 1,
        currentPage: 1
      },
      links: { first: '', next: '', previous: '', last: '' }
    };
  }
  const d = data as Partial<Paginated<T>>;
  return {
    items: (d.items ?? []) as T[],
    meta: d.meta ?? {
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1
    },
    links: d.links ?? { first: '', next: '', previous: '', last: '' }
  };
}

@Injectable({ providedIn: 'root' })
export class DragonBallApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBase;

  getCharacters(options: {
    page?: number;
    limit?: number;
    name?: string;
  }): Observable<Paginated<CharacterListItem>> {
    let params = new HttpParams();
    const hasName = !!options.name?.trim();
    if (hasName) {
      params = params.set('name', options.name!.trim());
    } else {
      if (options.page != null) params = params.set('page', String(options.page));
      if (options.limit != null) params = params.set('limit', String(options.limit));
    }
    return this.http.get<unknown>(`${this.base}/characters`, { params }).pipe(
      map((raw): Paginated<CharacterListItem> => normalizePaginated<CharacterListItem>(raw))
    );
  }

  getCharacterById(id: number): Observable<CharacterDetail> {
    return this.http.get<CharacterDetail>(`${this.base}/characters/${id}`);
  }

  getPlanets(options: {
    page?: number;
    limit?: number;
    name?: string;
    isDestroyed?: boolean;
  }): Observable<Paginated<PlanetListItem>> {
    let params = new HttpParams();
    const hasName = !!options.name?.trim();
    const hasDestroyed = options.isDestroyed === true || options.isDestroyed === false;
    if (hasName) {
      params = params.set('name', options.name!.trim());
    }
    if (hasDestroyed) {
      params = params.set('isDestroyed', String(options.isDestroyed));
    }
    if (!hasName && !hasDestroyed) {
      if (options.page != null) params = params.set('page', String(options.page));
      if (options.limit != null) params = params.set('limit', String(options.limit));
    }
    return this.http.get<unknown>(`${this.base}/planets`, { params }).pipe(
      map((raw): Paginated<PlanetListItem> => normalizePaginated<PlanetListItem>(raw))
    );
  }

  getPlanetById(id: number): Observable<PlanetDetail> {
    return this.http.get<PlanetDetail>(`${this.base}/planets/${id}`);
  }
}
