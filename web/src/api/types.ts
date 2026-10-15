export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  subtitle?: string;
  productCount: number;
}

export interface SellerSummary {
  id: string;
  shopName: string;
  verified: boolean;
  district?: string;
}

export interface SellerProfile {
  id: string;
  shopName: string;
  ownerName: string;
  village?: string;
  district?: string;
  state?: string;
  verified: boolean;
  rating: number;
  memberSince: string;
  productCount: number;
  products: Product[];
}

export interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  longDesc?: string;
  price: number;
  mrp: number;
  discountPercent: number;
  unit: string;
  packSizes: string[];
  stock: number;
  inStock: boolean;
  rating: number;
  ratingCount: number;
  image: string;
  gallery: string[];
  badge?: string;
  certification?: string;
  mandiPrice?: number;
  mandiSavings?: number;
  isFlashDeal: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  category?: { slug: string; name: string; icon: string };
  seller?: SellerSummary;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  brand: string;
  image: string;
  unit: string | null;
  price: number;
  mrp: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  savings: number;
}

export interface Cart {
  id: string;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  unit: string | null;
  image: string | null;
  price: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  addressName: string;
  addressPhone: string;
  addressLine: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: { name: string; phone: string };
}

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  sellerId: string | null;
  shopName: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string | null;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
  cartCount: number;
}

export interface OtpRequestResponse {
  /** How long the issued code stays valid. */
  expiresInSeconds: number;
  /**
   * Present only outside production (`OTP_DEV_BYPASS`): the generated code, so
   * the UI can pre-fill it when no SMS provider is configured.
   */
  devCode?: string;
}

export interface SellerStats {
  productCount: number;
  lowStock: number;
  outOfStock: number;
  orderCount: number;
  unitsSold: number;
  revenue: number;
  avgOrderValue: number;
}

export interface ProductQueryParams {
  category?: string;
  q?: string;
  brand?: string;
  isFlashDeal?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CheckoutInput {
  paymentMethod: "COD" | "UPI" | "CARD" | "KCC";
  address: {
    name: string;
    phone: string;
    line: string;
    city: string;
    state: string;
    pincode: string;
    label?: string;
  };
  notes?: string;
}

export interface CreateProductInput {
  name: string;
  brand: string;
  description: string;
  longDesc?: string;
  categorySlug: string;
  price: number;
  mrp: number;
  unit: string;
  packSizes: string[];
  stock: number;
  image: string;
  badge?: string;
  certification?: string;
  mandiPrice?: number;
}
