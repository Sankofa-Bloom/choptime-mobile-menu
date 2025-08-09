export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.choptym.com,https://choptym.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // For now, return a simple response to test CORS
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      message: 'CORS test successful - restaurants endpoint working',
      data: []
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
