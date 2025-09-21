import axios from 'axios';

// ==========================================
// RESEARCH SERVICE FOR DEEP RESEARCH
// ==========================================

class ResearchService {
  constructor() {
    // Using free APIs for research
    this.serpApiKey = process.env.SERP_API_KEY; // Optional: SerpAPI for better results
    this.maxSources = {
      quick: 3,
      moderate: 7,
      deep: 15
    };
  }

  /**
   * Perform research on a given topic
   * @param {string} query - Research query
   * @param {string} depth - Research depth (quick, moderate, deep)
   * @returns {Promise<Object>} Research results with sources
   */
  async performResearch(query, depth = 'moderate') {
    try {
      console.log(`Starting ${depth} research for: ${query}`);
      
      const maxSources = this.maxSources[depth] || 7;
      let sources = [];

      // Try SerpAPI first if available (paid but better results)
      if (this.serpApiKey) {
        sources = await this.searchWithSerpAPI(query, maxSources);
      } else {
        // Fallback to free alternatives
        sources = await this.searchWithFreeAPIs(query, maxSources);
      }

      // Filter and rank sources
      const processedSources = this.processSources(sources, query);
      
      // Get additional context for deep research
      if (depth === 'deep' && processedSources.length > 0) {
        const enhancedSources = await this.enhanceSourcesWithContext(processedSources);
        return {
          query,
          depth,
          sources: enhancedSources,
          sourceCount: enhancedSources.length,
          timestamp: new Date().toISOString()
        };
      }

      return {
        query,
        depth,
        sources: processedSources,
        sourceCount: processedSources.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Research error:', error);
      
      // Return minimal fallback result
      return {
        query,
        depth,
        sources: [],
        sourceCount: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Search using SerpAPI (if available)
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} Search results
   */
  async searchWithSerpAPI(query, maxResults) {
    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: query,
          api_key: this.serpApiKey,
          engine: 'google',
          num: maxResults,
          hl: 'en',
          gl: 'us'
        },
        timeout: 10000
      });

      return response.data.organic_results?.map(result => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        source: 'google',
        relevanceScore: this.calculateRelevance(result.title + ' ' + result.snippet, query)
      })) || [];

    } catch (error) {
      console.error('SerpAPI search error:', error);
      return [];
    }
  }

  /**
   * Search using free APIs as fallback
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} Search results
   */
  async searchWithFreeAPIs(query, maxResults) {
    const sources = [];

    try {
      // Wikipedia search (free and reliable)
      const wikipediaSources = await this.searchWikipedia(query, Math.min(3, maxResults));
      sources.push(...wikipediaSources);

      // If we need more sources, try other free APIs
      if (sources.length < maxResults) {
        const remaining = maxResults - sources.length;
        
        // NewsAPI for recent articles (if API key available)
        if (process.env.NEWS_API_KEY) {
          const newsSources = await this.searchNews(query, remaining);
          sources.push(...newsSources);
        }

        // Add some academic sources from arXiv for technical queries
        if (this.isTechnicalQuery(query)) {
          const arxivSources = await this.searchArxiv(query, Math.min(2, remaining));
          sources.push(...arxivSources);
        }
      }

      return sources;

    } catch (error) {
      console.error('Free API search error:', error);
      return sources; // Return whatever we managed to get
    }
  }

  /**
   * Search Wikipedia
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} Wikipedia results
   */
  async searchWikipedia(query, maxResults = 3) {
    try {
      // First, search for relevant pages
      const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: maxResults
        },
        timeout: 5000
      });

      const searchResults = searchResponse.data.query?.search || [];
      
      // Get extracts for each page
      const sources = [];
      for (const result of searchResults.slice(0, maxResults)) {
        try {
          const extractResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
              action: 'query',
              prop: 'extracts',
              exintro: true,
              explaintext: true,
              exsectionformat: 'plain',
              pageids: result.pageid,
              format: 'json'
            },
            timeout: 3000
          });

          const page = extractResponse.data.query?.pages?.[result.pageid];
          if (page && page.extract) {
            sources.push({
              title: result.title,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
              snippet: page.extract.substring(0, 300) + '...',
              source: 'wikipedia',
              relevanceScore: this.calculateRelevance(result.title + ' ' + page.extract, query)
            });
          }
        } catch (extractError) {
          console.warn('Failed to get Wikipedia extract:', extractError.message);
        }
      }

      return sources;

    } catch (error) {
      console.error('Wikipedia search error:', error);
      return [];
    }
  }

  /**
   * Search news articles
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} News results
   */
  async searchNews(query, maxResults = 3) {
    try {
      if (!process.env.NEWS_API_KEY) {
        return [];
      }

      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          apiKey: process.env.NEWS_API_KEY,
          pageSize: maxResults,
          sortBy: 'relevancy',
          language: 'en'
        },
        timeout: 5000
      });

      return response.data.articles?.map(article => ({
        title: article.title,
        url: article.url,
        snippet: article.description || article.content?.substring(0, 300) + '...',
        source: 'news',
        relevanceScore: this.calculateRelevance(article.title + ' ' + article.description, query),
        publishedAt: article.publishedAt
      })) || [];

    } catch (error) {
      console.error('News search error:', error);
      return [];
    }
  }

  /**
   * Search arXiv for academic papers
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} arXiv results
   */
  async searchArxiv(query, maxResults = 2) {
    try {
      const response = await axios.get('http://export.arxiv.org/api/query', {
        params: {
          search_query: `all:${query}`,
          start: 0,
          max_results: maxResults,
          sortBy: 'relevance',
          sortOrder: 'descending'
        },
        timeout: 5000
      });

      // Parse XML response (simplified)
      const xmlData = response.data;
      const sources = [];
      
      // Basic XML parsing for arXiv entries
      const entryRegex = /<entry>(.*?)<\/entry>/gs;
      const entries = xmlData.match(entryRegex) || [];

      for (const entry of entries.slice(0, maxResults)) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
        const linkMatch = entry.match(/<id>(.*?)<\/id>/s);

        if (titleMatch && summaryMatch && linkMatch) {
          sources.push({
            title: titleMatch[1].trim().replace(/\n/g, ' '),
            url: linkMatch[1].trim(),
            snippet: summaryMatch[1].trim().substring(0, 300) + '...',
            source: 'arxiv',
            relevanceScore: this.calculateRelevance(titleMatch[1] + ' ' + summaryMatch[1], query)
          });
        }
      }

      return sources;

    } catch (error) {
      console.error('arXiv search error:', error);
      return [];
    }
  }

  /**
   * Process and rank sources
   * @param {Array} sources - Raw sources
   * @param {string} query - Original query
   * @returns {Array} Processed sources
   */
  processSources(sources, query) {
    return sources
      .filter(source => source.title && source.url && source.snippet)
      .map(source => ({
        ...source,
        relevanceScore: source.relevanceScore || this.calculateRelevance(source.title + ' ' + source.snippet, query)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15); // Limit total sources
  }

  /**
   * Calculate relevance score between text and query
   * @param {string} text - Text to score
   * @param {string} query - Query to match against
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevance(text, query) {
    if (!text || !query) return 0;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    let score = 0;
    let totalWords = queryWords.length;

    // Simple relevance scoring
    for (const word of queryWords) {
      if (word.length > 2) { // Skip very short words
        const wordCount = (textLower.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(wordCount, 3) / 3; // Cap contribution per word
      }
    }

    return Math.min(score / totalWords, 1);
  }

  /**
   * Check if query is technical in nature
   * @param {string} query - Query to check
   * @returns {boolean} Is technical query
   */
  isTechnicalQuery(query) {
    const technicalKeywords = [
      'algorithm', 'programming', 'software', 'computer', 'technology',
      'machine learning', 'ai', 'artificial intelligence', 'data science',
      'mathematics', 'physics', 'chemistry', 'engineering', 'research'
    ];

    const queryLower = query.toLowerCase();
    return technicalKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Enhance sources with additional context (for deep research)
   * @param {Array} sources - Sources to enhance
   * @returns {Promise<Array>} Enhanced sources
   */
  async enhanceSourcesWithContext(sources) {
    // For now, just return sources as-is
    // In a full implementation, this could:
    // - Fetch full article content
    // - Extract key quotes
    // - Find related sources
    // - Perform sentiment analysis
    
    return sources.map(source => ({
      ...source,
      enhanced: true,
      contextAdded: new Date().toISOString()
    }));
  }

  /**
   * Health check for research service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Test Wikipedia API
      await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: 'test',
          format: 'json',
          srlimit: 1
        },
        timeout: 3000
      });

      return {
        status: 'healthy',
        apis: {
          wikipedia: 'operational',
          serpApi: this.serpApiKey ? 'configured' : 'not configured',
          newsApi: process.env.NEWS_API_KEY ? 'configured' : 'not configured'
        }
      };

    } catch (error) {
      return {
        status: 'degraded',
        error: error.message
      };
    }
  }
}

export default new ResearchService(); 