import { Product } from "@/types/index";
import { StoreProductTile } from "@/components/store/store-product-tile";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <StoreProductTile
      href={`/store/${product.category}/${product.slug}`}
      name={product.name}
      description={product.description}
      price={product.price}
      compareAtPrice={product.compareAtPrice}
      productType={product.type}
      categorySlug={product.category}
      categoryName={product.category}
      imageUrl={product.image}
      available={product.isLimited ? product.limitedStock ?? null : null}
      className="h-full"
    />
  );
}
