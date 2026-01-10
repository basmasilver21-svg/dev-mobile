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

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const { authenticatedRequest, user } = useAuth();
  const { 
    addToCart, 
    isProductInCart, 
    getProductQuantityInCart, 
    removeProductFromCart,
    updateCartItem,
    cartItems,
    getCartItemsCount
  } = useCart();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await authenticatedRequest(API_CONFIG.ENDPOINTS.PRODUCTS);
      setProducts(response || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await authenticatedRequest(API_CONFIG.ENDPOINTS.CATEGORIES);
      setCategories(response || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Ne pas afficher d'erreur pour les catégories car ce n'est pas critique
    }
  };

  const searchProducts = async (query) => {
    if (!query.trim()) {
      if (selectedCategory) {
        loadProductsByCategory(selectedCategory.id);
      } else {
        loadProducts();
      }
      return;
    }

    try {
      setLoading(true);
      const response = await authenticatedRequest(
        `${API_CONFIG.ENDPOINTS.PRODUCT_SEARCH}?nom=${encodeURIComponent(query)}`
      );
      setProducts(response || []);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByCategory = async (categoryId) => {
    try {
      setLoading(true);
      const response = await authenticatedRequest(
        `${API_CONFIG.ENDPOINTS.PRODUCTS_BY_CATEGORY}/${categoryId}`
      );
      setProducts(response || []);
    } catch (error) {
      console.error('Error loading products by category:', error);
      Alert.alert('Erreur', 'Erreur lors du filtrage par catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      searchProducts(text);
    } else if (text.length === 0) {
      if (selectedCategory) {
        loadProductsByCategory(selectedCategory.id);
      } else {
        loadProducts();
      }
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setShowCategoryFilter(false);
    
    if (category) {
      loadProductsByCategory(category.id);
    } else {
      loadProducts();
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    loadProducts();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    await loadCategories();
    setRefreshing(false);
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
        
        {/* Badge pour indiquer si le produit est dans le panier */}
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
            
            {/* Boutons d'action selon le rôle et l'état du panier */}
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
          
          {isInCart && !isAdmin && (
            <View style={styles.removeButtonContainer}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFromCart(item.id)}
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
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
          <Text style={styles.title}>Shopie</Text>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Panier')}
          >
            <Ionicons name="cart-outline" size={24} color="#64748b" />
            {getCartItemsCount() > 0 && (
              <View style={styles.cartBadgeHeader}>
                <Text style={styles.cartBadgeHeaderText}>
                  {getCartItemsCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowCategoryFilter(!showCategoryFilter)}
          >
            <Ionicons 
              name={selectedCategory ? "funnel" : "funnel-outline"} 
              size={20} 
              color={selectedCategory ? "#3b82f6" : "#64748b"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.advancedSearchButton}
            onPress={() => navigation.navigate('Search', { 
              initialQuery: searchQuery,
              initialCategory: selectedCategory 
            })}
          >
            <Ionicons name="options-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        {/* Filtre par catégorie */}
        {showCategoryFilter && (
          <View style={styles.categoryFilter}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive
              ]}
              onPress={() => handleCategorySelect(null)}
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
                onPress={() => handleCategorySelect(category)}
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
        )}
        
        {/* Indicateur de filtre actif */}
        {selectedCategory && (
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Catégorie: {selectedCategory.nom}
            </Text>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={16} color="#1d4ed8" />
              <Text style={styles.clearFilterText}>Effacer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          products.length > 0 && (selectedCategory || searchQuery) ? (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
                {selectedCategory && ` dans "${selectedCategory.nom}"`}
                {searchQuery && ` pour "${searchQuery}"`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {loading ? 'Chargement...' : 
               selectedCategory ? `Aucun produit dans "${selectedCategory.nom}"` :
               searchQuery ? 'Aucun produit trouvé pour cette recherche' :
               'Aucun produit trouvé'}
            </Text>
            {(selectedCategory || searchQuery) && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={clearFilters}
              >
                <Text style={styles.resetButtonText}>Voir tous les produits</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  cartButton: {
    position: 'relative',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBadgeHeader: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cartBadgeHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  filterButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  advancedSearchButton: {
    padding: 12,
    marginLeft: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  activeFilterText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFilterText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  productList: {
    padding: 16,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 6,
    borderRadius: 16,
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  productImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 22,
  },
  productCategory: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quantityButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
    color: '#1e293b',
  },
  removeButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeButtonText: {
    fontSize: 11,
    color: '#dc2626',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 26,
  },
  resetButton: {
    marginTop: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resultsHeader: {
    backgroundColor: '#f8fafc',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
});