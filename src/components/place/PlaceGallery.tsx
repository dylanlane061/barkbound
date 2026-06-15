import Photo, { type PhotoTone } from '@/components/kit/Photo';
import type { CatKey } from '@/lib/design/cats';

const TONES: PhotoTone[] = ['green', 'sand', 'cool'];

// Photo gallery hero. Placeholders stand in for real place imagery; a large
// lead photo + two stacked thumbnails.
export default function PlaceGallery({ category, label }: { category: CatKey | null; label?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, height: 280, marginBottom: 28 }}>
      <Photo h="100%" cat={category ?? undefined} tone="green" round={16} label={label} />
      <div className="col g12" style={{ height: '100%' }}>
        {TONES.slice(1).map((tone) => (
          <Photo key={tone} h="100%" cat={category ?? undefined} tone={tone} round={16} />
        ))}
      </div>
    </div>
  );
}
