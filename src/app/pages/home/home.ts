import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Observable, Subscription, finalize } from 'rxjs';
import { DragonBallApiService } from '../../core/dragonball-api.service';
import type {
  CharacterDetail,
  CharacterListItem,
  Paginated,
  PlanetDetail,
  PlanetListItem
} from '../../models/dragonball.types';

type CharacterPage = Paginated<CharacterListItem>;
type PlanetPage = Paginated<PlanetListItem>;

type ViewMode = 'characters' | 'planets';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: []
})
export class Home implements OnInit {
  private readonly api = inject(DragonBallApiService);

  protected readonly viewMode = signal<ViewMode>('characters');
  protected readonly searchText = signal('');
  protected readonly page = signal(1);
  protected readonly planetDestroyed = signal<boolean | undefined>(undefined);

  protected readonly listLoading = signal(false);
  protected readonly listError = signal<string | null>(null);
  protected readonly charactersList = signal<Paginated<CharacterListItem> | null>(null);
  protected readonly planetsList = signal<Paginated<PlanetListItem> | null>(null);

  protected readonly selectedCharacters = signal<CharacterDetail[]>([]);
  protected readonly selectionLoadingId = signal<number | null>(null);

  protected readonly expandedPlanetId = signal<number | null>(null);
  protected readonly planetDetailLoading = signal(false);
  protected readonly planetDetail = signal<PlanetDetail | null>(null);

  private searchDebounceHandle: ReturnType<typeof setTimeout> | undefined;
  private listSub?: Subscription;

  protected readonly isPlanetFilterActive = computed(
    () => this.planetDestroyed() === true || this.planetDestroyed() === false
  );

  protected readonly showPagination = computed(() => {
    const q = this.searchText().trim();
    if (this.viewMode() === 'characters') {
      return !q;
    }
    return !q && !this.isPlanetFilterActive();
  });

  ngOnInit(): void {
    this.loadList();
  }

  protected onSearchInput(raw: string): void {
    clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => {
      this.searchText.set(raw);
      this.page.set(1);
      this.loadList();
    }, 320);
  }

  protected setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.page.set(1);
    this.expandedPlanetId.set(null);
    this.loadList();
  }

  protected setPlanetDestroyed(value: boolean | undefined): void {
    this.planetDestroyed.set(value);
    this.page.set(1);
    this.loadList();
  }

  protected goPage(delta: number): void {
    this.page.update((p) => Math.max(1, p + delta));
    this.loadList();
  }

  protected loadList(): void {
    this.listSub?.unsubscribe();

    this.listLoading.set(true);
    this.listError.set(null);

    const mode = this.viewMode();
    const name = this.searchText().trim() || undefined;

    const finalizeLoading = finalize(() => this.listLoading.set(false));

    if (mode === 'characters') {
      const characters$: Observable<CharacterPage> = this.api.getCharacters({
        name,
        page: name ? undefined : this.page(),
        limit: name ? undefined : 10
      });
      this.listSub = characters$.pipe(finalizeLoading).subscribe({
        next: (data) => this.charactersList.set(data as CharacterPage),
        error: (err: unknown) => this.handleListError(err, 'characters')
      });
    } else {
      const planets$: Observable<PlanetPage> = this.api.getPlanets({
        name,
        isDestroyed: this.planetDestroyed(),
        page: name || this.isPlanetFilterActive() ? undefined : this.page(),
        limit: name || this.isPlanetFilterActive() ? undefined : 10
      });
      this.listSub = planets$.pipe(finalizeLoading).subscribe({
        next: (data) => this.planetsList.set(data as PlanetPage),
        error: (err: unknown) => this.handleListError(err, 'planets')
      });
    }
  }

  private handleListError(err: unknown, mode: 'characters' | 'planets'): void {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message)
        : 'โหลดข้อมูลไม่สำเร็จ';
    this.listError.set(msg);
    if (mode === 'characters') {
      this.charactersList.set(null);
    } else {
      this.planetsList.set(null);
    }
  }

  protected isSelected(id: number): boolean {
    return this.selectedCharacters().some((c) => c.id === id);
  }

  protected toggleSelectCharacter(item: CharacterListItem): void {
    if (this.isSelected(item.id)) {
      this.selectedCharacters.update((arr) => arr.filter((c) => c.id !== item.id));
      return;
    }
    this.selectionLoadingId.set(item.id);
    this.api
      .getCharacterById(item.id)
      .pipe(finalize(() => this.selectionLoadingId.set(null)))
      .subscribe({
        next: (detail) =>
          this.selectedCharacters.update((arr) => (arr.some((c) => c.id === detail.id) ? arr : [...arr, detail])),
        error: () => {
          /* แสดง error ระดับรายการถ้าต้องการ — ตอนนี้เงียบไว้ */
        }
      });
  }

  protected removeSelected(id: number): void {
    this.selectedCharacters.update((arr) => arr.filter((c) => c.id !== id));
  }

  protected togglePlanetExpand(id: number): void {
    if (this.expandedPlanetId() === id) {
      this.expandedPlanetId.set(null);
      this.planetDetail.set(null);
      return;
    }
    this.expandedPlanetId.set(id);
    this.planetDetail.set(null);
    this.planetDetailLoading.set(true);
    this.api
      .getPlanetById(id)
      .pipe(finalize(() => this.planetDetailLoading.set(false)))
      .subscribe({
        next: (d) => this.planetDetail.set(d),
        error: () => this.planetDetail.set(null)
      });
  }
}
