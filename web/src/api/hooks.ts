import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult
} from "@tanstack/react-query";
import { apiRequest, getToken, queryString } from "./client";
import type {
  Cart,
  Category,
  CheckoutInput,
  CreateProductInput,
  Order,
  Paginated,
  Product,
  ProductQueryParams,
  SavedAddress,
  SellerProfile,
  SellerStats
} from "./types";

/* ────────────────────────────── Queries ────────────────────────────── */

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiRequest<{ items: Category[] }>("/categories", { auth: false }),
    select: (d) => d.items
  });
}

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () =>
      apiRequest<Paginated<Product>>(`/products${queryString(params as Record<string, unknown>)}`, {
        auth: false
      }),
    placeholderData: (prev) => prev
  });
}

export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: () => apiRequest<Product>(`/products/${idOrSlug}`, { auth: false }),
    enabled: Boolean(idOrSlug)
  });
}

export function useRelatedProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ["related", slug],
    queryFn: () => apiRequest<{ items: Product[] }>(`/products/${slug}/related`, { auth: false }),
    enabled: Boolean(slug),
    select: (d) => d.items
  });
}

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiRequest<Cart>("/cart"),
    // Hold until the frictionless demo session has installed a token, so the
    // first paint never fires an unauthenticated request.
    enabled: Boolean(getToken())
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => apiRequest<{ items: Order[] }>("/orders"),
    enabled: Boolean(getToken()),
    select: (d) => d.items
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => apiRequest<Order>(`/orders/${id}`),
    enabled: Boolean(id) && Boolean(getToken())
  });
}

export function useSellerStats() {
  return useQuery({
    queryKey: ["seller", "stats"],
    queryFn: () => apiRequest<SellerStats>("/seller/stats"),
    enabled: Boolean(getToken())
  });
}

export function useSellerProducts() {
  return useQuery({
    queryKey: ["seller", "products"],
    queryFn: () => apiRequest<{ items: Product[] }>("/seller/products"),
    enabled: Boolean(getToken()),
    select: (d) => d.items
  });
}

export function useSellerOrders(status?: string) {
  return useQuery({
    queryKey: ["seller", "orders", status ?? "ALL"],
    queryFn: () =>
      apiRequest<{ items: Order[] }>(`/seller/orders${queryString({ status })}`),
    enabled: Boolean(getToken()),
    select: (d) => d.items
  });
}

export function useSellerProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["seller-profile", id],
    queryFn: () => apiRequest<SellerProfile>(`/sellers/${id}`, { auth: false }),
    enabled: Boolean(id)
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiRequest<{ items: SavedAddress[] }>("/addresses"),
    enabled: Boolean(getToken()),
    select: (d) => d.items
  });
}

/* ────────────────────────────── Mutations ────────────────────────────── */

function useCartMutation<TArgs>(
  fn: (args: TArgs) => Promise<Cart>
): UseMutationResult<Cart, Error, TArgs> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      qc.setQueryData(["cart"], cart);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function useAddToCart() {
  return useCartMutation((args: { productId: string; quantity?: number; unit?: string }) =>
    apiRequest<Cart>("/cart/items", { method: "POST", body: args })
  );
}

export function useUpdateCartItem() {
  return useCartMutation((args: { itemId: string; quantity: number }) =>
    apiRequest<Cart>(`/cart/items/${args.itemId}`, {
      method: "PATCH",
      body: { quantity: args.quantity }
    })
  );
}

export function useRemoveCartItem() {
  return useCartMutation((args: { itemId: string }) =>
    apiRequest<Cart>(`/cart/items/${args.itemId}`, { method: "DELETE" })
  );
}

export function useClearCart() {
  return useCartMutation(() => apiRequest<Cart>("/cart", { method: "DELETE" }));
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      apiRequest<Order>("/orders", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    }
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiRequest<Product>("/seller/products", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
      qc.invalidateQueries({ queryKey: ["seller", "stats"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    }
  });
}

export function useDeleteSellerProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<{ deleted: boolean }>(`/seller/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
      qc.invalidateQueries({ queryKey: ["seller", "stats"] });
    }
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      apiRequest<Order>(`/seller/orders/${args.id}/status`, {
        method: "PATCH",
        body: { status: args.status }
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "orders"] });
      qc.invalidateQueries({ queryKey: ["seller", "stats"] });
    }
  });
}
