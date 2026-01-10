import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
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

  const renderProduct = ({ item }) => {
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
            
            {/* Boutons d'ajout au panier supprimés */}
          </View>
          

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
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Recherche Avancée</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Filtres de recherche */}
        <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
          {/* Recherche par nom */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Recherche par nom</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Nom du produit..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
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
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={priceRange.max}
                onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#94a3b8"
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
              <Ionicons name="refresh-outline" size={18} color="#64748b" />
              <Text style={styles.clearButtonText}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={performSearch}
            >
              <Ionicons name="search" size={18} color="white" />
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={80} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>
              {loading ? 'Recherche en cours...' : 'Aucun produit trouvé'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 48, // Même largeur que le bouton back pour centrer le titre
  },
  filtersContainer: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
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
  categoryFilter: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  sortFilter: {
    flexDirection: 'row',
    gap: 10,
  },
  sortChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 50,
    padding: 24,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});