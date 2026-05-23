import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  category_slug: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collection_type: string;
}

interface CategoryPageProps {
  params: Promise<{
    collectionSlug: string;
    categorySlug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { collectionSlug, categorySlug } = await params;
  const supabase = createAdminClient();

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .eq('collection_type', collectionSlug)
    .eq('is_active', true)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  const { data: productsData, error: productsError } = await supabase
    .from('Product')
    .select('id, name, slug, description, price, images, category_slug')
    .eq('category_slug', categorySlug)
    .order('createdAt', { ascending: false });

  const products = (productsData as Product[] | null) || [];

  const featuredProduct = products[0] || null;
  const otherProducts = products.slice(1);

  return (
    <div className="min-h-screen bg-krearte-cream">
      <div className="container mx-auto px-6 md:px-12 py-6">
        <nav className="text-sm text-krearte-gray-600">
          <Link href="/" className="hover:text-krearte-black">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/collection/${collectionSlug}`} className="hover:text-krearte-black">
            {collectionSlug === 'wallcovering' ? 'Wallcovering' : collectionSlug}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-krearte-black font-medium">{category.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-8 md:py-12">
        <h1 className="font-sans text-4xl md:text-5xl font-light mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-krearte-gray-600 font-light text-lg max-w-3xl">{category.description}</p>
        )}
      </div>

      {featuredProduct && (
        <div className="container mx-auto px-6 md:px-12 mb-16">
          <Link href={`/product/${featuredProduct.slug}`} className="group block">
            <div className="aspect-[16/9] bg-krearte-gray-100 rounded-lg overflow-hidden mb-6">
              {(() => {
                const images = featuredProduct.images || [];
                const mainImage = images.find((img: string) => !img.endsWith('.mp4') && !img.endsWith('.webm')) || images[0];
                return mainImage ? (
                  <img src={mainImage} alt={featuredProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                    <span className="text-9xl font-light">{featuredProduct.name.charAt(0)}</span>
                  </div>
                );
              })()}
            </div>
            <h2 className="text-2xl md:text-3xl font-normal mb-2">{featuredProduct.name}</h2>
          </Link>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12 pb-20">
        {otherProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-krearte-gray-500 font-light">No products yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherProducts.map((product) => {
              const images = product.images || [];
              const mainImage = images.find((img: string) => !img.endsWith('.mp4') && !img.endsWith('.webm')) || images[0];
              return (
                <Link key={product.id} href={`/product/${product.slug}`} className="group">
                  <div className="aspect-square bg-krearte-gray-100 rounded-lg overflow-hidden mb-4">
                    {mainImage ? (
                      <img src={mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl font-light text-krearte-gray-400">{product.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-sans text-lg font-normal">{product.name}</h3>
                  <p className="text-krearte-black">{formatCurrency(product.price)}/m²</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}