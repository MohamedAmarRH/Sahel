const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.BACKEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERREUR: SUPABASE_URL et SUPABASE_ANON_KEY sont requis!');
  console.error('Veuillez créer un fichier .env avec vos credentials Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== ORDERS API ====================

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message
    });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      nom,
      telephone,
      type_evenement,
      date_evenement,
      quantite,
      adresse,
      message,
      produits
    } = req.body;

    // Validation
    if (!nom || !telephone || !quantite) {
      return res.status(400).json({
        success: false,
        message: 'Nom, téléphone et quantité sont requis'
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        nom,
        telephone,
        type_evenement,
        date_evenement,
        quantite,
        adresse,
        message,
        produits: produits || [],
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message
    });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Statut mis à jour',
      data
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Commande supprimée'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// ==================== REVIEWS API ====================

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average rating
    const reviews = data || [];
    const averageRating = reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: reviews,
      meta: {
        total: reviews.length,
        averageRating: parseFloat(averageRating)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
});

// Create new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    // Validation
    if (!name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Nom, note et commentaire sont requis'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 1 et 5'
      });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        name,
        rating,
        comment,
        likes: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      data
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis',
      error: error.message
    });
  }
});

// Like a review
app.put('/api/reviews/:id/like', async (req, res) => {
  try {
    const { id } = req.params;

    // Get current likes
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('likes')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('reviews')
      .update({ likes: (review.likes || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Like ajouté',
      data
    });
  } catch (error) {
    console.error('Error liking review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du like',
      error: error.message
    });
  }
});

// Delete review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Avis supprimé'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// ==================== CONTACT API ====================

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nom et message sont requis'
      });
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        name,
        email,
        phone,
        message,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data
    });
  } catch (error) {
    console.error('Error sending contact:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
});

// ==================== STATS API ====================

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    // Get orders count
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status');

    if (ordersError) throw ordersError;

    // Get reviews count and average
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating');

    if (reviewsError) throw reviewsError;

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    const averageRating = reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: {
        orders: {
          total: orders.length,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          delivered: deliveredOrders
        },
        reviews: {
          total: reviews.length,
          averageRating: parseFloat(averageRating)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Yaourt du Sahel est en ligne',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Yaourt du Sahel',
    documentation: '/api/health',
    endpoints: {
      orders: '/api/orders',
      reviews: '/api/reviews',
      contact: '/api/contact',
      stats: '/api/stats'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🥛 YAOURT DU SAHEL - API SERVER');
  console.log('='.repeat(60));
  console.log(`📡 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💾 Base de données: Supabase PostgreSQL`);
  console.log('='.repeat(60));
  console.log('Endpoints disponibles:');
  console.log(`  GET  /api/health     - Vérification de l'API`);
  console.log(`  GET  /api/orders     - Liste des commandes`);
  console.log(`  POST /api/orders     - Créer une commande`);
  console.log(`  GET  /api/reviews    - Liste des avis`);
  console.log(`  POST /api/reviews    - Créer un avis`);
  console.log(`  GET  /api/stats      - Statistiques`);
  console.log('='.repeat(60));
});

module.exports = app;
