
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedQuery, Product, AvailableFilters } from '../types';

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this context, we will proceed, but calls will fail if the key isn't set.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const querySchema = {
  type: Type.OBJECT,
  properties: {
    base_query: {
      type: Type.STRING,
      description: "The core product search term, excluding all filters. E.g., 'men's sandals', 'running shoes'."
    },
    filters: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of specific filters that were mentioned by the user AND are present in the provided available filters list."
    },
  },
  required: ['base_query', 'filters']
};

export const parseSearchQuery = async (naturalLanguageQuery: string, availableFilters: AvailableFilters): Promise<ParsedQuery> => {
  try {
    const prompt = `You are an intelligent shopping assistant. Your task is to analyze the user's search query and extract two things:
1. A 'base_query': The core product search term, excluding all filters.
2. A list of 'filters': Specific attributes mentioned by the user that EXACTLY MATCH one of the available filter options provided below.

Available Filters (by category):
${JSON.stringify(availableFilters, null, 2)}

Rules:
- Only include a filter if it is an exact, case-sensitive match from the list above.
- If a user mentions a brand like "Bata shoes", the filter is "Bata".
- If no filters from the list are mentioned, return an empty 'filters' array.
- Return the result as a JSON object adhering to the provided schema.

User Query: "${naturalLanguageQuery}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: querySchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (typeof parsedJson.base_query === 'string' && Array.isArray(parsedJson.filters)) {
        return parsedJson as ParsedQuery;
    } else {
        throw new Error("Parsed JSON from Gemini does not match the expected format.");
    }

  } catch (error) {
    console.error("Error parsing search query with Gemini:", error);
    throw new Error("Could not understand the search query. Please try rephrasing.");
  }
};

export const summarizeProducts = async (products: Product[]): Promise<string> => {
  try {
    const productInfoForSummary = products.map(p => ({
      seller: p.seller,
      price: p.price_current,
      rating: p.rating_score,
    }));

    const prompt = `You are a helpful and witty shopping assistant. Based on the following product data, provide a short, friendly, one-sentence summary for the user. Mention the number of products found and a key trend (e.g., a popular brand, a good price range, or high ratings).

Product Data: ${JSON.stringify(productInfoForSummary)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error summarizing products with Gemini:", error);
    return "Here are the products I found for you!"; // Return a graceful fallback
  }
}
