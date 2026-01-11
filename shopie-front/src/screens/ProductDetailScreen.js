import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { API_CONFIG } from '../config/api';

export default function ProductDetailScreen({ route }) {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ 
          uri: product.imageUrl && product.imageUrl.startsWith('http') 
            ? product.imageUrl 
            : product.imageUrl 
              ? `${API_CONFIG.BASE_URL}${product.imageUrl}`
              : 'https://via.placeholder.com/400x300?text=No+Image'
        }}
        style={styles.productImage}
        defaultSource={{ uri: 'https://via.placeholder.com/400x300?text=No+Image' }}
      />
      
      <View style={styles.content}>
        <Text style={styles.productName}>{product.nom}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{product.prix?.toFixed(2)} €</Text>
          {/* Stock display removed - products always appear available */}
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {product.description || 'Aucune description disponible.'}
        </Text>


      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 20,
  },
  outOfStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  outOfStockText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});