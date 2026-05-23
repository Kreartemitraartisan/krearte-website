import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // ✅ Mencegah cache stale data di development

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[] | null;
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

  console.log('🔍 Fetching category:', { collectionSlug, categorySlug });

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .eq('collection_type', collectionSlug)
    .eq('is_active', true)
    .single();

  if (categoryError || !category) {
    console.error('❌ Category not found:', categoryError);
    notFound();
  }

  console.log('✅ Category found:', category.name);

  console.log('🔍 Fetching products for category_slug:', categorySlug);
  const { data: productsData, error: productsError } = await supabase
    .from('Product')
    .select('id, name, slug, description, price, images, category_slug')
    .eq('category_slug', categorySlug)
    .order('createdAt', { ascending: false });

  console.log('📦 Raw products response:', { 
    count: productsData?.length, 
    error: productsError,
    firstProduct: productsData?.[0] 
  });

  if (productsError) {
    console.error('❌ Products fetch error:', productsError);
  }

  const products: Product[] = (productsData as Product[] | null) || [];

  console.log('✅ Processed products count:', products.length);

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-krearte-cream flex flex-col items-center justify-center py-20">
        <div className="container mx-auto px-6 md:px-12">
          <nav className="text-sm text-krearte-gray-600 mb-12">
            <Link href="/" className="hover:text-krearte-black">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/collection/${collectionSlug}`} className="hover:text-krearte-black">
              {collectionSlug === 'wallcovering' ? 'Wallcovering' : collectionSlug}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-krearte-black font-medium">{category.name}</span>
          </nav>
          <h1 className="font-sans text-4xl md:text-5xl font-light mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-krearte-gray-600 font-light text-lg max-w-3xl mb-8">{category.description}</p>
          )}
          <div className="text-center py-20">
            <p className="text-krearte-gray-500 font-light text-lg mb-4">No products in this category yet.</p>
            <p className="text-krearte-gray-400 text-sm">
              Check terminal logs for debug info, or add products with category_slug: <code className="bg-krearte-gray-100 px-2 py-1 rounded">{categorySlug}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const featuredProduct = products[0];
  const otherProducts = products.slice(1);

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Breadcrumb */}
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

      {/* Header */}
      <div className="container mx-auto px-6 md:px-12 py-8 md:py-12">
        <h1 className="font-sans text-4xl md:text-5xl font-light mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-krearte-gray-600 font-light text-lg max-w-3xl">{category.description}</p>
        )}
      </div>

      {/* Featured Product */}
      {featuredProduct && (
        <div className="container mx-auto px-6 md:px-12 mb-16">
          <Link href={`/product/${featuredProduct.slug}`} className="group block">
            <div className="aspect-[16/9] bg-krearte-gray-100 rounded-lg overflow-hidden mb-6">
              {(() => {
                const images = featuredProduct.images || [];
                const mainImage = Array.isArray(images) && images.length > 0
                  ? images.find((img: string) => !img.endsWith('.mp4') && !img.endsWith('.webm')) || images[0]
                  : null;
                return mainImage ? (
                  <img src={mainImage} alt={featuredProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                    <span className="text-9xl font-light">{featuredProduct.name.charAt(0)}</span>
                  </div>
                );
              })()}
            </div>
            <h2 className="text-2xl md:text-3xl font-normal mb-2 group-hover:underline decoration-krearte-gray-300 underline-offset-4 transition-all">
              {featuredProduct.name}
            </h2>
            <p className="text-krearte-black font-normal">
              {formatCurrency(featuredProduct.price)}<span className="text-sm text-krearte-gray-500 font-light">/m²</span>
            </p>
          </Link>
        </div>
      )}

      {/* Other Products Grid */}
      <div className="container mx-auto px-6 md:px-12 pb-20">
        {otherProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherProducts.map((product) => {
              const images = product.images || [];
              const mainImage = Array.isArray(images) && images.length > 0
                ? images.find((img: string) => !img.endsWith('.mp4') && !img.endsWith('.webm')) || images[0]
                : null;
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
                  <h3 className="font-sans text-lg font-normal group-hover:underline decoration-krearte-gray-300 underline-offset-4 transition-all">
                    {product.name}
                  </h3>
                  <p className="text-krearte-black font-normal">
                    {formatCurrency(product.price)}<span className="text-sm text-krearte-gray-500 font-light">/m²</span>
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          products.length === 1 && (
            <p className="text-krearte-gray-400 text-sm italic">This is the only product in this category.</p>
          )
        )}
      </div>
    </div>
  );
}