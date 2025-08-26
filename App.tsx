
import React, { useState, useCallback, useEffect } from 'react';
import { Product, ParsedQuery, AvailableFilters } from './types';
import { parseSearchQuery, summarizeProducts } from './services/geminiService';
import SearchBar from './components/SearchBar';
import ProductGrid from './components/ProductGrid';
import AiAnalysis from './components/AiAnalysis';
import LoadingSkeleton from './components/LoadingSkeleton';
import { SparklesIcon } from './components/icons/SparklesIcon';

// The backend server is expected to be running on this address.
const SCRAPER_API_URL = 'http://127.0.0.1:5000/scrape';


const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/data/available-filters.json');
        if (!response.ok) throw new Error('Failed to load filter data.');
        const data: AvailableFilters = await response.json();
        setAvailableFilters(data);
      } catch (err) {
        console.error(err);
        setError('Could not load search filters. Functionality may be limited.');
        setAvailableFilters({}); // Fallback to prevent crash
      }
    };
    fetchFilters();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query.');
      return;
    }
    if (!availableFilters) {
      setError('Filters are not loaded yet. Please wait a moment and try again.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setParsedQuery(null);
    setAiSummary(null);

    try {
      // Step 1: Use Gemini to parse the natural language query.
      console.log('Step 1: Asking AI to parse the query...');
      const parsed = await parseSearchQuery(searchQuery, availableFilters);
      setParsedQuery(parsed);
      
      // Step 2: Call the Python backend server to run the scraper.
      console.log('Step 2: Sending structured query to Python backend scraper...', parsed);
      const scraperResponse = await fetch(SCRAPER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed),
      });

      if (!scraperResponse.ok) {
        const errorData = await scraperResponse.json();
        throw new Error(`Scraper Error: ${errorData.error || 'Failed to fetch product data.'}`);
      }
      
      const data: Product[] = await scraperResponse.json();
      setProducts(data);
      console.log('Step 2 Complete: Received product data from scraper.', data);


      // Step 3: Use Gemini to summarize the results.
      if (data.length > 0) {
        console.log('Step 3: Asking AI to summarize the results...');
        const summary = await summarizeProducts(data);
        setAiSummary(summary);
        console.log('Step 3 Complete: Received AI summary.');
      } else {
         console.log('Step 3: No products found, skipping summary.');
         setAiSummary("I couldn't find any products matching your specific criteria. Try broadening your search!");
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`An error occurred: ${errorMessage}. Is the Python server running?`);
      setProducts([]);
      setParsedQuery(null);
      setAiSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, availableFilters]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900">
        <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10"></div>
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">
              Gemini Shopping Search
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
              Describe what you're looking for, and our AI will trigger a live web scraper.
            </p>
          </header>

          <div className="max-w-3xl mx-auto">
            <SearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {error && (
            <div className="mt-8 text-center bg-red-900/50 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
              <p>{error}</p>
            </div>
          )}

          {isLoading && !parsedQuery && <LoadingSkeleton />}

          {(isLoading || !isLoading) && parsedQuery && (
            <AiAnalysis parsedQuery={parsedQuery} summary={aiSummary} isLoadingSummary={isLoading && products.length > 0} />
          )}

          {!isLoading && products.length > 0 && (
            <ProductGrid products={products} />
          )}

          {!isLoading && !error && products.length === 0 && !parsedQuery && (
            <div className="text-center mt-16 flex flex-col items-center">
              <SparklesIcon className="w-16 h-16 text-indigo-400 opacity-50 mb-4" />
              <p className="text-gray-400 text-xl">Let's find something amazing.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
