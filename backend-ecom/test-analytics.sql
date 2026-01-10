-- Script de test pour vérifier les corrections d'analytics

-- 1. Vérifier le nombre total de commandes
SELECT 'Total commandes' as metric, COUNT(*) as value FROM orders;

-- 2. Vérifier les revenus totaux (toutes commandes)
SELECT 'Revenus totaux' as metric, SUM(total) as value FROM orders;

-- 3. Vérifier les commandes du mois en cours
SELECT 'Commandes ce mois' as metric, COUNT(*) as value 
FROM orders 
WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE());

-- 4. Vérifier les revenus du mois en cours
SELECT 'Revenus ce mois' as metric, SUM(total) as value 
FROM orders 
WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE());

-- 5. Vérifier les commandes en attente
SELECT 'Commandes en attente' as metric, COUNT(*) as value FROM orders WHERE statut = 'PENDING';

-- 6. Vérifier les produits en stock faible
SELECT 'Produits stock faible' as metric, COUNT(*) as value FROM products WHERE stock < 10;

-- 7. Top 5 des produits les plus vendus (basé sur les order_items)
SELECT 
    p.nom as produit,
    SUM(oi.quantite) as total_vendu,
    SUM(oi.prix * oi.quantite) as revenus
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
GROUP BY p.id, p.nom
ORDER BY revenus DESC
LIMIT 5;

-- 8. Évolution des commandes par jour (7 derniers jours)
SELECT 
    DATE(date) as jour,
    COUNT(*) as nb_commandes,
    SUM(total) as revenus
FROM orders 
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(date)
ORDER BY jour DESC;

-- 9. Vérifier les statuts disponibles
SELECT DISTINCT statut, COUNT(*) as count FROM orders GROUP BY statut;

-- 10. Vérifier les méthodes de paiement
SELECT DISTINCT methode_paiement, COUNT(*) as count FROM orders GROUP BY methode_paiement;