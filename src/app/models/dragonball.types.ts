export interface Meta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface Links {
  first: string;
  next: string;
  previous: string;
  last: string;
}

export interface Paginated<T> {
  items: T[];
  meta: Meta;
  links: Links;
}

export interface CharacterListItem {
  id: number;
  name: string;
  ki: string;
  maxKi: string;
  race: string;
  gender: string;
  image: string;
  affiliation: string;
  description: string;
}

export interface Transformation {
  id: number;
  name: string;
  ki: string;
  image?: string;
}

export interface CharacterDetail extends CharacterListItem {
  originPlanet: PlanetListItem | null;
  transformations: Transformation[];
}

export interface PlanetListItem {
  id: number;
  name: string;
  isDestroyed: boolean;
  image: string;
  description?: string;
}

export interface PlanetDetail extends PlanetListItem {
  characters: CharacterListItem[];
}
