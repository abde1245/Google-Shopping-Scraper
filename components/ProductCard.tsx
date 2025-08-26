
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const animationDelay = `${index * 75}ms`;

  const renderImage = () => {
    if (product.image_url) {
      // Use a proxy if images are blocked by CORS, but for now we assume they work.
      return <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />;
    }
    // Fallback to a placeholder
    const seed = product.title.replace(/\s+/g, '');
    return <img src={`https://picsum.photos/seed/${seed}/400/400`} alt={product.title} className="w-full h-full object-cover" />;
  };

  return (
    <a
      href={product.product_link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay }}
      className="block bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden group transform hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 animate-fade-in-up"
    >
      <div className="aspect-square overflow-hidden bg-slate-700">
        {renderImage()}
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-400 mb-1">{product.seller}</p>
        <h3 className="font-semibold text-gray-200 leading-tight truncate group-hover:text-indigo-400 transition-colors duration-300">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-lg font-bold text-cyan-400">{product.price_current}</p>
          {product.price_original && (
            <p className="text-sm text-gray-500 line-through">{product.price_original}</p>
          )}
        </div>
        {product.rating_score && (
          <div className="mt-2 flex items-center text-sm text-gray-400">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{product.rating_score}</span>
            {product.review_count && <span className="ml-1">({product.review_count})</span>}
          </div>
        )}
      </div>
    </a>
  );
};

// Add keyframes for animation in a style tag within the component, or globally in index.html.
// Since we can't add to index.html directly, we'll rely on Tailwind's JIT.
// A simpler way for this environment is to create a custom Tailwind config, but we'll define it here conceptually.
// In a real project, this would be in your tailwind.config.js
// We add this style to the head dynamically
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out forwards;
    opacity: 0;
  }
  @keyframes tilt {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(0.5deg); }
    75% { transform: rotate(-0.5deg); }
  }
  .animate-tilt {
    animation: tilt 10s infinite linear;
  }
`;
document.head.appendChild(style);


export default ProductCard;
