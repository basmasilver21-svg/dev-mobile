-- Script de mise à jour pour ajouter les champs adresse et téléphone à la table users
-- et la méthode de paiement à la table orders

-- Ajouter les colonnes adresse et téléphone à la table users
ALTER TABLE users 
ADD COLUMN telephone VARCHAR(15),
ADD COLUMN adresse VARCHAR(255);

-- Ajouter la colonne méthode de paiement à la table orders
ALTER TABLE orders 
ADD COLUMN methode_paiement VARCHAR(20);

-- Commentaires pour les nouvelles colonnes
COMMENT ON COLUMN users.telephone IS 'Numéro de téléphone de l''utilisateur';
COMMENT ON COLUMN users.adresse IS 'Adresse de livraison de l''utilisateur';
COMMENT ON COLUMN orders.methode_paiement IS 'Méthode de paiement choisie (CARTE ou ESPECES)';