import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_CONFIG } from '../config/api';

export default function SearchScreen({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.initialCategory || null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name'); // name, price_asc, price_desc

  const { authenticatedRequest, user } = useAuth();
  const { 
    addToCart, 
    isProductInCart, 
    getProductQuantityInCart, 
    removeProductFromCart,
    updateCartItem,
    getCartItemsCount 
  } = useCart();

  useEffect(() => {
    loadCategories();
    if (route.params?.initialQuery || route.params?.initialCategory) {
      performSearch();
    }
  }, []);

  const loadCategories = async () => {
    try {
      const response = await authenticatedRequest(API_CONFIG.ENDPOINTS.CATEGORIES);
      setCategories(response || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      let response = [];

      if (selectedCategory && !searchQuery.trim()) {
        // Recherche par catégorie uniquement
        response = await authenticatedRequest(
          `${API_CONFIG.ENDPOINTS.PRODUCTS_BY_CATEGORY}/${selectedCategory.id}`
        );
      } else if (searchQuery.trim()) {
        // Recherche par nom
        response = await authenticatedRequest(
          `${API_CONFIG.ENDPOINTS.PRODUCT_SEARCH}?nom=${encodeURIComponent(searchQuery)}`
        );
      } else {
        // Tous les produits
        response = await authenticatedRequest(API_CONFIG.ENDPOINTS.PRODUCTS);
      }

      let filteredProducts = response || [];

      // Filtrer par catégorie si une recherche par nom est active
      if (selectedCategory && searchQuery.trim()) {
        filteredProducts = filteredProducts.filter(
          product => product.category?.id === selectedCategory.id
        );
      }

      // Filtrer par prix
      if (priceRange.min || priceRange.max) {
        filteredProducts = filteredProducts.filter(product => {
          const price = parseFloat(product.prix);
          const min = priceRange.min ? parseFloat(priceRange.min) : 0;
          const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
          return price >= min && price <= max;
        });
      }

      // Trier les résultats
      filteredProducts.sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return parseFloat(a.prix) - parseFloat(b.prix);
          case 'price_desc':
            return parseFloat(b.prix) - parseFloat(a.prix);
          case 'name':
          default:
            return a.nom.localeCompare(b.nom);
        }
      });

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error performing search:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
    setProducts([]);
  };

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, 1);
    if (result.success) {
      Alert.alert('Succès', 'Produit ajouté au panier');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible d\'ajouter au panier');
    }
  };

  const handleRemoveFromCart = async (productId) => {
    const result = await removeProductFromCart(productId);
    if (result.success) {
      Alert.alert('Succès', 'Produit retiré du panier');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de retirer du panier');
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const cartItem = isProductInCart(productId);
    if (cartItem) {
      const result = await updateCartItem(cartItem.id, newQuantity);
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de modifier la quantité');
      }
    }
  };

  const renderProduct = ({ item }) => {
    const isInCart = isProductInCart(item.id);
    const quantityInCart = getProductQuantityInCart(item.id);
    const isAdmin = user?.role === 'ADMIN';

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image
          source={{ 
            uri: item.imageUrl && item.imageUrl.startsWith('http') 
              ? item.imageUrl 
              : item.imageUrl 
                ? `${API_CONFIG.BASE_URL}${item.imageUrl}`
                : 'https://via.placeholder.com/150x150?text=No+Image'
          }}
          style={styles.productImage}
          defaultSource={{ uri: 'https://via.placeholder.com/150x150?text=No+Image' }}
        />
        
        {isInCart && !isAdmin && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{quantityInCart}</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nom}
          </Text>
          {item.category && (
            <Text style={styles.productCategory}>{item.category.nom}</Text>
          )}
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>
              {item.prix?.toFixed(2)} €
            </Text>
            
            {!isAdmin && (
              <View style={styles.cartActions}>
                {isInCart ? (
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.id, quantityInCart - 1)}
                    >
                      <Ionicons name="remove" size={16} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantityInCart}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.id, quantityInCart + 1)}
                    >
                      <Ionicons name="add" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item.id)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {/* Stock display removed - products always appear available */}
          {isInCart && !isAdmin && (
            <View style={styles.removeButtonContainer}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFromCart(item.id)}
              >
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={styles.removeButtonText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Recherche Avancée</Text>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Panier')}
          >
            <Ionicons name="cart-outline" size={24} color="#6366f1" />
            {getCartItemsCount() > 0 && (
              <View style={styles.cartBadgeHeader}>
                <Text style={styles.cartBadgeHeaderText}>
                  {getCartItemsCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filtres de recherche */}
        <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
          {/* Recherche par nom */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Recherche par nom</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Nom du produit..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* Catégorie */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryFilter}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    !selectedCategory && styles.categoryChipTextActive
                  ]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory?.id === category.id && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory?.id === category.id && styles.categoryChipTextActive
                    ]}>
                      {category.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Fourchette de prix */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Prix (€)</Text>
            <View style={styles.priceRangeContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={priceRange.min}
                onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={priceRange.max}
                onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* Tri */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Trier par</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sortFilter}>
                {[
                  { key: 'name', label: 'Nom' },
                  { key: 'price_asc', label: 'Prix ↑' },
                  { key: 'price_desc', label: 'Prix ↓' },
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[
                      styles.sortChip,
                      sortBy === sort.key && styles.sortChipActive
                    ]}
                    onPress={() => setSortBy(sort.key)}
                  >
                    <Text style={[
                      styles.sortChipText,
                      sortBy === sort.key && styles.sortChipTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={performSearch}
            >
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productList}
        ListHeaderComponent={
          products.length > 0 ? (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {loading ? 'Recherche en cours...' : 'Aucun produit trouvé'}
            </Text>
            <Text style={styles.emptySubtext}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadgeHeader: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersContainer: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  sortFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortChipActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  sortChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  productList: {
    padding: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: 'white',
    margin: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 10,
    color: '#6366f1',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 4,
  },
  quantityButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    color: '#666',
  },
  outOfStock: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  lowStock: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  removeButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  removeButtonText: {
    fontSize: 10,
    color: '#ef4444',
    marginLeft: 2,
  },
  resultsHeader: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});