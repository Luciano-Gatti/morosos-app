import { useQuery } from '@tanstack/react-query';
import { fetchMorosos } from './api';
import type { MorososFilters } from './types';

const morososKey = ['morosos'];

export function useMorosos(filters: MorososFilters) {
  return useQuery({
    queryKey: [...morososKey, filters],
    queryFn: () => fetchMorosos(filters)
  });
}
