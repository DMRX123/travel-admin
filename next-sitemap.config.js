// next-sitemap.config.js
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://travel-admin.vercel.app',
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
}