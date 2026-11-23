/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Mejor compatibilidad con Drag and Drop y WebSockets
  images: {
    domains: [
      'images.unsplash.com',
      'covers.openlibrary.org',
      'm.media-amazon.com',
      'books.google.com'
    ],
  },
};

module.exports = nextConfig;
