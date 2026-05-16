import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'unlockpremium-372c9';
const BASE_URL = 'https://www.unlockpremium.store';

const staticRoutes = [
  '/',
  '/how-it-works',
  '/products',
  '/checkout',
  '/guides',
  '/testimonials',
  '/faqs',
  '/contact-support',
  '/activation-warranty',
  '/legal-privacy-notice',
  '/refund-activation-policy'
];

async function fetchCollection(collectionName) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=100`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${collectionName}: ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

async function generateSitemap() {
  console.log('Generating sitemap...');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static routes
  for (const route of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${route}</loc>\n`;
    xml += `    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>\n`;
    xml += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Add dynamic guides
  const posts = await fetchCollection('posts');
  posts.forEach(post => {
    const fields = post.fields;
    if (!fields) return;
    const status = fields.status?.stringValue || 'draft';
    if (status === 'draft') return; // Skip drafts

    const slug = fields.slug?.stringValue;
    if (slug) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/guides/${slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }
  });

  // Add dynamic services
  const products = await fetchCollection('products');
  products.forEach(product => {
    const fields = product.fields;
    if (!fields) return;
    const isActive = fields.isActive?.booleanValue;
    if (isActive === false) return; // Skip inactive

    const id = fields.id?.stringValue;
    if (id) {
      // Assuming services are accessed via /services/:id
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/services/${id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  });

  xml += `</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Sitemap successfully generated at ${sitemapPath}`);
}

generateSitemap().catch(console.error);
