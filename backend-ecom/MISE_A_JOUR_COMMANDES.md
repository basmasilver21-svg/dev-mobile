# Mise à jour du système de commandes

## Modifications apportées

### 1. Ajout des informations utilisateur
- **Téléphone** : Champ obligatoire pour passer une commande
- **Adresse** : Champ obligatoire pour la livraison
- Ces informations sont sauvegardées dans le profil utilisateur

### 2. Nouvelles méthodes de paiement
- **Carte bancaire** : Paiement par carte (remplace Stripe, PayPal, Apple Pay)
- **Espèces** : Paiement en espèces à la livraison

### 3. Modifications backend

#### Modèle User
- Ajout du champ `telephone` (VARCHAR 15)
- Ajout du champ `adresse` (VARCHAR 255)

#### Modèle Order
- Ajout de l'énumération `MethodePaiement` (CARTE, ESPECES)
- Ajout du champ `methodePaiement`

#### Nouveaux endpoints
- `GET /users/profile` : Récupérer le profil utilisateur
- `PUT /users/profile` : Mettre à jour le profil utilisateur
- `POST /orders?methodePaiement=CARTE|ESPECES` : Créer une commande avec méthode de paiement

### 4. Modifications frontend

#### Écran de checkout
- Formulaire pour saisir téléphone et adresse
- Validation des champs obligatoires
- Sélection de la méthode de paiement (Carte ou Espèces)
- Mise à jour automatique du profil utilisateur

#### Écran des commandes
- Affichage de la méthode de paiement pour chaque commande

## Installation

### 1. Base de données
Exécuter le script SQL :
```bash
mysql -u root -p shopie_db < database-update-user-order.sql
```

### 2. Backend
Redémarrer l'application Spring Boot pour prendre en compte les nouveaux modèles et contrôleurs.

### 3. Frontend
Aucune installation supplémentaire requise, les modifications sont dans le code existant.

## Utilisation

### Pour l'utilisateur
1. Aller au panier et cliquer sur "Passer commande"
2. Remplir le téléphone et l'adresse (obligatoires)
3. Choisir la méthode de paiement :
   - **Carte bancaire** : Simulation de paiement
   - **Espèces** : Paiement à la livraison
4. Confirmer la commande

### Validation
- Le téléphone doit contenir 8-15 caractères (chiffres, +, -, espaces, parenthèses)
- L'adresse doit contenir au moins 10 caractères
- Les informations sont sauvegardées dans le profil pour les prochaines commandes

## Notes techniques

- Les informations de profil sont mises à jour automatiquement lors de chaque commande
- La méthode de paiement est stockée avec chaque commande pour traçabilité
- L'interface s'adapte selon la méthode de paiement choisie (messages différents)
- Compatibilité maintenue avec les commandes existantes (methodePaiement peut être null)