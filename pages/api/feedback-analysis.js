// pages/api/feedback-analysis.js
import { supabaseAdmin } from '../../lib/supabase';

const SENTIMENT_KEYWORDS = {
  positive: ['good', 'great', 'excellent', 'awesome', 'perfect', 'nice', 'smooth', 'safe', 'friendly', 'professional', 'clean', 'comfortable'],
  negative: ['bad', 'poor', 'terrible', 'horrible', 'worst', 'slow', 'late', 'rude', 'unprofessional', 'dirty', 'uncomfortable', 'cancel'],
};

export default async function handler(req, res) {
  const { startDate, endDate, driverId } = req.query;
  
  let query = supabaseAdmin
    .from('ratings')
    .select('rating, review, created_at, driver_id, user:user_id(full_name)');
  
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (driverId) query = query.eq('driver_id', driverId);
  
  const { data: reviews } = await query;
  
  const analysis = {
    total: reviews.length,
    averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1),
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    commonIssues: {},
    commonPraises: {},
    topDrivers: {},
  };
  
  reviews.forEach(review => {
    // Sentiment analysis
    if (review.review) {
      const lowerReview = review.review.toLowerCase();
      let isPositive = false, isNegative = false;
      
      SENTIMENT_KEYWORDS.positive.forEach(word => {
        if (lowerReview.includes(word)) isPositive = true;
      });
      SENTIMENT_KEYWORDS.negative.forEach(word => {
        if (lowerReview.includes(word)) isNegative = true;
      });
      
      if (isPositive && !isNegative) analysis.sentiment.positive++;
      else if (isNegative && !isPositive) analysis.sentiment.negative++;
      else analysis.sentiment.neutral++;
      
      // Extract common issues
      SENTIMENT_KEYWORDS.negative.forEach(word => {
        if (lowerReview.includes(word)) {
          analysis.commonIssues[word] = (analysis.commonIssues[word] || 0) + 1;
        }
      });
      
      // Extract common praises
      SENTIMENT_KEYWORDS.positive.forEach(word => {
        if (lowerReview.includes(word)) {
          analysis.commonPraises[word] = (analysis.commonPraises[word] || 0) + 1;
        }
      });
    }
    
    // Top drivers analysis
    if (review.driver_id) {
      if (!analysis.topDrivers[review.driver_id]) {
        analysis.topDrivers[review.driver_id] = { total: 0, sum: 0 };
      }
      analysis.topDrivers[review.driver_id].total++;
      analysis.topDrivers[review.driver_id].sum += review.rating;
    }
  });
  
  // Convert to array and sort
  analysis.topDrivers = Object.entries(analysis.topDrivers)
    .map(([id, data]) => ({ driverId: id, averageRating: data.sum / data.total, totalReviews: data.total }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);
  
  res.json(analysis);
}