import { db } from './client';
import { places } from './schema';

await db.insert(places).values([
  { name: 'Acadia National Park', city: 'Bar Harbor', state: 'ME' },
  { name: 'Zion National Park', city: 'Springdale', state: 'UT' },
  { name: 'Cape Hatteras National Seashore', city: 'Nags Head', state: 'NC' },
  { name: 'Olympic National Park', city: 'Port Angeles', state: 'WA' },
  { name: 'Shenandoah National Park', city: 'Luray', state: 'VA' },
]).onConflictDoNothing();

console.log('Seeded places');
process.exit(0);
