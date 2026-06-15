import { redirect } from 'next/navigation';

// Home is the Trips gallery; search now lives in Discover.
export default function Home() {
  redirect('/trips');
}
