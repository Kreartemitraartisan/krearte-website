import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collection_type: string;
  parent_id: string | null;
  products_count?: { count: number }[];
}

interface CollectionPageProps {
  params: {
    collectionSlug: string;
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const supabase = createAdminClient();
  const { collectionSlug } = params;

  // Fetch categories untuk collection ini
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      products_count:products(count)
    `)
    .eq('collection_type', collectionSlug)
    .eq('is_active', true)
    .is('parent_id', null) // Hanya kategori level atas
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Supabase error fetching categories:', error);
  }

  // Mapping nama & deskripsi collection
  const collectionNames: Record<string, string> = {
    wallcovering: 'Wallcovering Collection',
    designer: 'Designer Collections',
    material: 'Materials'
  };

  const collectionDescriptions: Record<string, string> = {
    wallcovering: 'Discover our curated selection of luxury wallcoverings, crafted with premium materials and timeless designs.',
    designer: 'Explore our exclusive designer collections featuring premium metallic and textured finishes.',
    material: 'Browse our selection of high-quality materials for your custom projects.'
  };

  const collectionName = collectionNames[collectionSlug];
  const collectionDescription = collectionDescriptions[collectionSlug];

  if (!collectionName) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Header Section */}
      <div className="container mx-auto px-6 md:px-12 py-12 md:py-20">
        <h1 className="font-sans text-4xl md:text-5xl font-light mb-4 text-krearte-black">
          {collectionName}
        </h1>
        {collectionDescription && (
          <p className="text-krearte-gray-600 font-light text-lg max-w-3xl">
            {collectionDescription}
          </p>
        )}
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-6 md:px-12 pb-20">
        {(!categories || categories.length === 0) ? (
          <div className="text-center py-20">
            <p className="text-krearte-gray-500 font-light text-lg mb-4">
              No categories available yet.
            </p>
            <p className="text-krearte-gray-400 text-sm">
              Please check back later or contact us for more information.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {categories.map((category: Category) => {
              const productsCount = category.products_count?.[0]?.count || 0;

              return (
                <Link
                  key={category.id}
                  href={`/collection/${collectionSlug}/${category.slug}`}
                  className="group"
                >
                  {/* Category Card Image */}
                  <div className="aspect-[4/5] bg-krearte-gray-100 rounded-lg overflow-hidden mb-4">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-krearte-gray-100 to-krearte-gray-200">
                        <span className="text-8xl font-light text-krearte-gray-400">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Info */}
                  <div>
                    <h3 className="font-sans text-xl md:text-2xl font-normal text-krearte-black mb-2 group-hover:underline decoration-krearte-gray-300 underline-offset-4 transition-all">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-krearte-gray-600 font-light text-sm mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-sm text-krearte-gray-400 font-light">
                      {productsCount} {productsCount === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}