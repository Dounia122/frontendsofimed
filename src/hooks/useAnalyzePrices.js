import { useState } from 'react';
import axios from 'axios';

export const useAnalyzePrices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const analyzePrices = async (productName, currentPrice) => {
    setLoading(true);
    setError(null);
    try {
      // Appel à l'API eBay Search via notre backend
      const response = await axios.get(`/api/products/search?query=${encodeURIComponent(productName)}`);
      const ebayPrices = response.data.prices;

      // Appel à l'API de taux de change pour convertir en MAD
      const exchangeResponse = await axios.get('/api/exchange/rates');
      const usdToMadRate = exchangeResponse.data.rates.MAD;

      // Calcul des statistiques de prix
      const prices = ebayPrices.map(price => price * usdToMadRate);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calcul des suggestions
      const suggestedPrice = averagePrice * 0.9; // 10% en dessous de la moyenne
      const suggestedDiscount = ((currentPrice - suggestedPrice) / currentPrice) * 100;

      setResults({
        marketPrices: {
          min: minPrice.toFixed(2),
          max: maxPrice.toFixed(2),
          average: averagePrice.toFixed(2)
        },
        suggestedPrice: suggestedPrice.toFixed(2),
        suggestedDiscount: Math.max(0, suggestedDiscount).toFixed(2)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { analyzePrices, loading, error, results };
};