-- ============================================
-- YAOURT DU SAHEL - SCHEMA BASE DE DONNEES
-- PostgreSQL pour Supabase
-- ============================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: orders (Commandes)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    type_evenement VARCHAR(100),
    date_evenement DATE,
    quantite TEXT NOT NULL,
    adresse TEXT,
    message TEXT,
    produits JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_telephone ON orders(telephone);

-- Commentaires sur la table
COMMENT ON TABLE orders IS 'Table des commandes de yaourt et toukoudi';
COMMENT ON COLUMN orders.status IS 'Statut: pending, confirmed, delivered, cancelled';

-- ============================================
-- TABLE: reviews (Avis clients)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les avis
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Commentaires
COMMENT ON TABLE reviews IS 'Avis et évaluations des clients';

-- ============================================
-- TABLE: contacts (Messages de contact)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Commentaires
COMMENT ON TABLE contacts IS 'Messages envoyés via le formulaire de contact';

-- ============================================
-- FONCTION: Mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLITIQUES DE SECURITE (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les avis
DROP POLICY IF EXISTS "Tout le monde peut lire les avis" ON reviews;
CREATE POLICY "Tout le monde peut lire les avis" ON reviews
    FOR SELECT USING (true);

-- Politique: Tout le monde peut créer un avis
DROP POLICY IF EXISTS "Tout le monde peut créer un avis" ON reviews;
CREATE POLICY "Tout le monde peut créer un avis" ON reviews
    FOR INSERT WITH CHECK (true);

-- Politique: Tout le monde peut liker (mettre à jour likes)
DROP POLICY IF EXISTS "Tout le monde peut liker" ON reviews;
CREATE POLICY "Tout le monde peut liker" ON reviews
    FOR UPDATE USING (true) WITH CHECK (true);

-- Politique: Tout le monde peut lire les commandes (pour démo)
-- En production, vous voudrez restreindre cela
DROP POLICY IF EXISTS "Tout le monde peut lire les commandes" ON orders;
CREATE POLICY "Tout le monde peut lire les commandes" ON orders
    FOR SELECT USING (true);

-- Politique: Tout le monde peut créer une commande
DROP POLICY IF EXISTS "Tout le monde peut créer une commande" ON orders;
CREATE POLICY "Tout le monde peut créer une commande" ON orders
    FOR INSERT WITH CHECK (true);

-- Politique: Tout le monde peut mettre à jour une commande
DROP POLICY IF EXISTS "Tout le monde peut mettre à jour une commande" ON orders;
CREATE POLICY "Tout le monde peut mettre à jour une commande" ON orders
    FOR UPDATE USING (true) WITH CHECK (true);

-- Politique: Tout le monde peut créer un contact
DROP POLICY IF EXISTS "Tout le monde peut créer un contact" ON contacts;
CREATE POLICY "Tout le monde peut créer un contact" ON contacts
    FOR INSERT WITH CHECK (true);

-- ============================================
-- DONNEES DE TEST (Optionnel)
-- ============================================

-- Insérer quelques avis de test
INSERT INTO reviews (name, rating, comment, likes) VALUES
    ('Amadou I.', 5, 'Excellent yaourt ! Très frais et délicieux. Je commande régulièrement pour ma famille.', 12),
    ('Fatima Z.', 5, 'Le toukoudi est parfait pour nos cérémonies. Tous mes invités adorent !', 8),
    ('Moussa K.', 4, 'Très bon produit, livraison rapide à Zinder. Je recommande.', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Connectez-vous à votre projet Supabase
-- 2. Allez dans l'éditeur SQL (SQL Editor)
-- 3. Copiez et exécutez ce script
-- 4. Les tables seront créées automatiquement
-- ============================================
