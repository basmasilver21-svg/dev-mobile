# Guide d'ajout des catégories à la base de données

## 1. Mise à jour automatique avec Spring Boot

Si vous utilisez `spring.jpa.hibernate.ddl-auto=update` dans votre configuration, les nouvelles tables et colonnes seront créées automatiquement au démarrage de l'application.

## 2. Mise à jour manuelle de la base de données

Si vous préférez contrôler les modifications de la base de données, exécutez ces commandes SQL :

### Créer la table des catégories
```sql
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    INDEX idx_nom (nom)
);
```

### Ajouter la colonne category_id à la table products
```sql
ALTER TABLE products ADD COLUMN category_id BIGINT;
ALTER TABLE products ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD INDEX idx_category (category_id);
```

### Insérer des catégories d'exemple
```sql
INSERT INTO categories (nom, description) VALUES 
('Smartphones', 'Téléphones mobiles et accessoires'),
('Ordinateurs', 'Ordinateurs portables et de bureau'),
('Audio', 'Écouteurs, casques et haut-parleurs'),
('Tablettes', 'Tablettes et liseuses électroniques'),
('Montres', 'Montres connectées et accessoires');
```

### Mettre à jour les produits existants (optionnel)
```sql
-- Assigner des catégories aux produits existants
UPDATE products SET category_id = 1 WHERE nom LIKE '%iPhone%' OR nom LIKE '%Samsung%';
UPDATE products SET category_id = 2 WHERE nom LIKE '%MacBook%' OR nom LIKE '%PC%' OR nom LIKE '%ordinateur%';
UPDATE products SET category_id = 3 WHERE nom LIKE '%AirPods%' OR nom LIKE '%casque%' OR nom LIKE '%écouteur%';
UPDATE products SET category_id = 4 WHERE nom LIKE '%iPad%' OR nom LIKE '%tablette%';
UPDATE products SET category_id = 5 WHERE nom LIKE '%Watch%' OR nom LIKE '%montre%';
```

## 3. Vérification

Pour vérifier que tout fonctionne correctement :

```sql
-- Voir toutes les catégories
SELECT * FROM categories;

-- Voir les produits avec leurs catégories
SELECT p.nom as produit, c.nom as categorie 
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id;

-- Compter les produits par catégorie
SELECT c.nom as categorie, COUNT(p.id) as nombre_produits
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.nom;
```

## 4. Nouveaux endpoints disponibles

Après la mise à jour, vous aurez accès à ces nouveaux endpoints :

### Catégories
- `GET /api/categories` - Lister toutes les catégories
- `GET /api/categories/{id}` - Récupérer une catégorie
- `GET /api/categories/search?nom=...` - Rechercher des catégories
- `POST /api/categories` - Créer une catégorie (Admin)
- `PUT /api/categories/{id}` - Modifier une catégorie (Admin)
- `DELETE /api/categories/{id}` - Supprimer une catégorie (Admin)

### Produits par catégorie
- `GET /api/products/category/{categoryId}` - Produits d'une catégorie
- `GET /api/products/category/{categoryId}/available` - Produits disponibles d'une catégorie

## 5. Utilisation dans l'interface admin

L'écran d'administration des produits a été mis à jour pour inclure :
- Sélection de catégorie lors de la création/modification d'un produit
- Affichage de la catégorie dans la liste des produits
- Filtrage par catégorie (à implémenter côté frontend si nécessaire)

## 6. Exemple d'utilisation avec curl

```bash
# Créer une nouvelle catégorie
curl -X POST http://localhost:8081/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"nom": "Accessoires", "description": "Accessoires divers"}'

# Créer un produit avec catégorie
curl -X POST http://localhost:8081/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nom": "Chargeur iPhone",
    "description": "Chargeur rapide pour iPhone",
    "prix": 29.99,
    "stock": 100,
    "category": {"id": 1}
  }'
```