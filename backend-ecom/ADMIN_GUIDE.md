# Guide Administrateur - Shopie

## Navigation pour les Administrateurs

En tant qu'administrateur, vous avez accès à deux types d'interfaces :

### 1. Interface Utilisateur Standard
Accessible via les onglets du bas :

- **Accueil** : Parcourir et acheter des produits (comme un utilisateur normal)
- **Panier** : Gérer votre panier personnel
- **Commandes** : Voir VOS commandes personnelles (pas celles des autres utilisateurs)
- **Profil** : Gérer votre profil personnel

### 2. Interface d'Administration
Accessible via l'onglet "Admin" ou le dashboard :

- **Gestion des Produits** : Ajouter, modifier, supprimer des produits
- **Gestion des Catégories** : Créer et gérer les catégories de produits
- **Gestion des Commandes** : Voir et gérer TOUTES les commandes de tous les utilisateurs
- **Gestion des Utilisateurs** : Voir les comptes utilisateurs
- **Statistiques** : Voir les rapports et analyses

## Différence Important : Commandes

### Onglet "Commandes" (Interface Utilisateur)
- Affiche uniquement VOS commandes personnelles
- Vous permet de voir l'historique de vos propres achats
- Bouton "Gérer toutes les commandes" pour accéder à l'interface admin

### "Gestion des Commandes" (Interface Admin)
- Affiche TOUTES les commandes de tous les utilisateurs
- Permet de changer le statut des commandes (En attente → Payée → Expédiée → Livrée)
- Interface de gestion pour l'administration

## Utilisation Recommandée

1. **Pour vos achats personnels** : Utilisez les onglets du bas comme un utilisateur normal
2. **Pour administrer la boutique** : Utilisez l'onglet "Admin" et le dashboard d'administration

## Endpoints API

### Commandes Personnelles
- `GET /api/orders` - Vos commandes personnelles (même pour les admins)

### Gestion Administrative
- `GET /api/orders/admin/all` - Toutes les commandes (admin uniquement)
- `PUT /api/orders/admin/{id}/status` - Changer le statut d'une commande (admin uniquement)

Cette séparation permet aux administrateurs d'avoir une expérience utilisateur normale tout en ayant accès aux outils d'administration quand nécessaire.