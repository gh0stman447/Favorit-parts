import type { ApiGood, ApiResponse } from './types';
import { API_KEY, API_URL } from '../../constants/api';

async function request(params: Record<string, string>, signal: AbortSignal): Promise<ApiGood[]> {
  const query = new URLSearchParams({ key: API_KEY, ...params });
  const response = await fetch(`${API_URL}?${query}`, { signal });
  if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

  let data: ApiResponse;
  try {
    data = (await response.json()) as ApiResponse;
  } catch {
    throw new Error('Сервис вернул некорректный ответ.');
  }

  if (data.error) throw new Error(Array.isArray(data.error) ? data.error.join(', ') : data.error);
  return Array.isArray(data.goods) ? data.goods : [];
}

export function loadBrands(number: string, signal: AbortSignal) {
  return request({ number }, signal);
}

export function loadOffers(number: string, brand: string, signal: AbortSignal) {
  return request({ number, brand, analogues: 'on' }, signal);
}
