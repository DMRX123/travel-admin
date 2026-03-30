module.exports = {
  siteUrl: 'https://maasaraswatitravels.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/dashboard' },
      { userAgent: '*', disallow: '/login' },
      { userAgent: '*', disallow: '/api' },
    ],
  },
  exclude: ['/dashboard/*', '/login', '/api/*'],
  outDir: './public',
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};