import { Product } from '@/types';
import {
  fetchProductsFromSupabase,
  createProductInSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
  bulkImportProductsToSupabase,
} from './supabaseService';

export async function fetchProducts(userEmail?: string): Promise<Product[]> {
  return fetchProductsFromSupabase(userEmail);
}

export async function fetchProductById(id: string, userEmail?: string): Promise<Product | undefined> {
  const products = await fetchProductsFromSupabase(userEmail);
  return products.find((p) => p.id === id);
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt'>,
  userEmail?: string
): Promise<Product> {
  return createProductInSupabase(data, userEmail);
}

export async function updateProduct(
  id: string,
  data: Partial<Product>,
  userEmail?: string
): Promise<Product> {
  return updateProductInSupabase(id, data, userEmail);
}

export async function deleteProduct(id: string, userEmail?: string): Promise<void> {
  await deleteProductFromSupabase(id, userEmail);
}

export async function duplicateProduct(id: string, userEmail?: string): Promise<Product> {
  const existing = await fetchProductById(id, userEmail);
  if (!existing) throw new Error('Product not found');

  const { id: _, createdAt: __, ...rest } = existing;
  return createProductInSupabase(
    {
      ...rest,
      name: `${existing.name} (Copy)`,
      sku: `${existing.sku}-COPY`,
    },
    userEmail
  );
}

export async function bulkImportProducts(
  products: Partial<Product>[],
  userEmail?: string
): Promise<{ count: number }> {
  return bulkImportProductsToSupabase(products, userEmail);
}
