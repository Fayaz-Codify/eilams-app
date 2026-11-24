/**
 * The app's only route to the backend. One base URL, one place that attaches
 * the bearer token, one place that turns Laravel's error envelope into
 * something a screen can show.
 *
 * `EXPO_PUBLIC_API_URL` is the full API base, e.g. https://eilams.com/api/v1 —
 * the same value documented in docs/CUSTOMER-APP-API.md on the server repo.
 */
import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from './token-storage';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://eilams.com/api/v1'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** First validation message for a field, if the server sent one. */
  field(name: string): string | null {
    return this.errors[name]?.[0] ?? null;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** Skip the bearer header (register / login). */
  public?: boolean;
  /** Return the raw Response instead of parsed JSON. */
  raw?: boolean;
};

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (!options.public) {
    const token = await tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // A phone on a train has no signal; that is not a server error.
    throw new ApiError('No connection. Check your network and try again.', 0);
  }

  if (options.raw) return response as unknown as T;

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === 'string' && payload.message) ||
      (response.status === 401
        ? 'Please sign in again.'
        : response.status === 404
          ? 'We could not find that.'
          : 'Something went wrong. Please try again.');

    throw new ApiError(message, response.status, payload?.errors ?? {});
  }

  if (response.status === 204) return undefined as unknown as T;

  return payload as T;
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ types */

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  member_since: string | null;
};

export type City = {
  city: string;
  slug: string;
  hotels: number;
  cover: string | null;
};

export type PaymentMethod = { key: string; label: string; configured: boolean };

export type Bootstrap = {
  brand: { name: string; support_email: string; support_phone: string; whatsapp: string };
  cities: City[];
  amenities: Record<string, string>;
  payment_methods: PaymentMethod[];
  defaults: { check_in: string; check_out: string; adults: number };
  currencies: string[];
};

export type Price = {
  per_night: number;
  total: number;
  room_type: string | null;
  room_type_id?: number;
  left: number | null;
  nights: number;
  currency: string;
  available: boolean;
};

export type HotelCardData = {
  id: number;
  slug: string;
  name: string;
  city: string;
  stars: number;
  property_type: string;
  image: string | null;
  rating: number | null;
  reviews_count: number;
  amenities: string[];
  price: Price;
};

export type Room = {
  id: number;
  name: string;
  description: string | null;
  max_adults: number;
  max_children: number;
  left: number;
  min_stay: number;
  bookable: boolean;
  reason: string | null;
  per_night: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  images: string[];
};

export type HotelDetail = Omit<HotelCardData, 'amenities'> & {
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: string | null;
  child_policy: string | null;
  pet_policy: string | null;
  images: string[];
  amenities: { key: string; label: string }[];
  rooms: Room[];
  reviews: { id: number; rating: number; comment: string; name: string; date: string }[];
};

export type Stay = { check_in: string; check_out: string; nights: number; adults: number; children: number };

export type SearchMeta = {
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
  stay: Stay;
  query: { city: string; q: string; sort: string };
};

export type SearchResponse = { data: HotelCardData[]; meta: SearchMeta };

export type BookingRoom = {
  id: number;
  room_type_id: number;
  name: string | null;
  room_number: string | null;
  price_per_night: number;
  nights: number;
  line_total: number;
};

export type Booking = {
  id: number;
  reference: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  payment_method: string;
  source: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  special_requests: string | null;
  created_at: string | null;
  can_cancel: boolean;
  can_pay: boolean;
  hotel: {
    id: number | null;
    name: string | null;
    slug: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    stars: number;
    cancellation_policy: string | null;
    image: string | null;
  };
  rooms: BookingRoom[];
};

export type Intent = {
  reference: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  gateway_reference: string | null;
  paid_at: string | null;
  created_at: string | null;
};

export type Checkout = {
  mode: 'sandbox' | 'redirect';
  action: string;
  /** Hosted page that submits the signed fields — what a native app opens. */
  page?: string;
  method: string;
  fields: Record<string, string>;
  cancel_url?: string;
};

/* ----------------------------------------------------------------- calls */

export const api = {
  bootstrap: () => request<Bootstrap>('/bootstrap', { public: true }),

  search: (params: Record<string, string | number>) =>
    request<SearchResponse>(`/hotels?${new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString()}`, { public: true }),

  hotel: (slug: string, params: Record<string, string | number>) =>
    request<{ data: HotelDetail; meta: { stay: Stay } }>(
      `/hotels/${slug}?${new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString()}`,
      { public: true },
    ),

  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    device_name?: string;
  }) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body, public: true }),

  login: (body: { email: string; password: string; device_name?: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body, public: true }),

  me: () => request<{ data: User }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, public: true }),

  bookings: (scope: 'upcoming' | 'past' | 'all' = 'upcoming') =>
    request<{ data: Booking[]; meta: { total: number; has_more: boolean } }>(`/bookings?scope=${scope}`),

  booking: (id: number | string) => request<{ data: Booking }>(`/bookings/${id}`),

  storeBooking: (body: Record<string, unknown>) =>
    request<{ data: Booking; payment?: { intent: Intent; checkout: Checkout } }>('/bookings', {
      method: 'POST',
      body,
    }),

  cancelBooking: (id: number | string, reason?: string) =>
    request<{ data: Booking }>(`/bookings/${id}/cancel`, { method: 'POST', body: reason ? { reason } : {} }),

  createPayment: (bookingId: number | string, provider?: string) =>
    request<{ data: Intent; checkout: Checkout }>(`/bookings/${bookingId}/payment-intents`, {
      method: 'POST',
      body: provider ? { provider } : {},
    }),

  intent: (reference: string) => request<{ data: Intent; booking: { data: Booking } | null }>(
      `/payment-intents/${reference}`,
    ),

  registerDevice: (token: string, platform: 'ios' | 'android' | 'web') =>
    request<{ message: string }>('/device-tokens', { method: 'POST', body: { token, platform } }),
};
