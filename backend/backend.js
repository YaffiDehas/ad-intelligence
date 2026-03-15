const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

// Register CORS — allow frontend origins
fastify.register(cors, {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:8080',  // Docker / production build
  ],
  methods: ['GET'],
});

// Helper for dummy images
const getDummyImage = () => {
  const randomId = Math.floor(Math.random() * 500) + 1;
  const cacheBuster = Date.now() + Math.random();
  return `https://picsum.photos/id/${randomId}/144/256?t=${cacheBuster}`;
};

// 1. Get Server State
fastify.get('/api/server-state', async () => ({
  status: 'up',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

// 2. Get Products
fastify.get('/api/products', async () => ({
  products: ['Nike Air Max', 'Nike React', 'Nike Pegasus', 'Nike Mercurial', 'Nike Blazer']
}));

// 3. Get Stats
fastify.get('/api/stats/:section', async (request) => {
  const { section } = request.params;
  return {
    section,
    current: Math.floor(Math.random() * 2000),
    trend: (Math.random() * 200 - 100).toFixed(1),
    benchmark: Math.floor(Math.random() * 1000)
  };
});

// 4. Get Quick Wins
fastify.get('/api/wins', async (request) => {
  const { page = 1 } = request.query;
  const ads = Array.from({ length: 10 }).map((_, i) => ({
    id: `ad-${page}-${i}`,
    title: `Campaign ${Math.floor(Math.random() * 1000)}`,
    description: 'High performing ad creative for selected product.',
    imageUrl: getDummyImage(),
    launched: '2026-03-07',
    duplications: Math.floor(Math.random() * 10)
  }));

  return { ads, has_more: page < 5 };
});

const start = async () => {
  try {
    // 0.0.0.0 is required so Docker exposes the port correctly
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
