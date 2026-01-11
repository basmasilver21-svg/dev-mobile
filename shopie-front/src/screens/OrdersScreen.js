import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { authenticatedRequest, user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await authenticatedRequest(API_CONFIG.ENDPOINTS.ORDERS);
      setOrders(response || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'PAID':
        return '#10b981';
      case 'SHIPPED':
        return '#3b82f6';
      case 'DELIVERED':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#fef3c7';
      case 'PAID':
        return '#d1fae5';
      case 'SHIPPED':
        return '#dbeafe';
      case 'DELIVERED':
        return '#dcfce7';
      default:
        return '#f3f4f6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'PAID':
        return 'Payée';
      case 'SHIPPED':
        return 'Expédiée';
      case 'DELIVERED':
        return 'Livrée';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return 'time-outline';
      case 'PAID':
        return 'checkmark-circle-outline';
      case 'SHIPPED':
        return 'airplane-outline';
      case 'DELIVERED':
        return 'checkmark-done-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId}>Commande #{item.id}</Text>
          <Text style={styles.orderDate}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: getStatusBgColor(item.statut),
            borderColor: getStatusColor(item.statut)
          }
        ]}>
          <Ionicons 
            name={getStatusIcon(item.statut)} 
            size={14} 
            color={getStatusColor(item.statut)}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
            {getStatusText(item.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.orderRow}>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag-outline" size={18} color="#64748b" />
            <Text style={styles.orderTotal}>
              {item.total?.toFixed(2)} €
            </Text>
          </View>

          {item.orderItems && item.orderItems.length > 0 && (
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={18} color="#64748b" />
              <Text style={styles.orderItems}>
                {item.orderItems.length} article{item.orderItems.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {item.methodePaiement && (
          <View style={styles.paymentRow}>
            <Ionicons 
              name={item.methodePaiement === 'CARTE' ? 'card-outline' : 'cash-outline'} 
              size={16} 
              color="#64748b" 
            />
            <Text style={styles.orderPayment}>
              {item.methodePaiement === 'CARTE' ? 'Carte bancaire' : 'Paiement en espèces'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.viewDetails}>Voir les détails</Text>
        <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
      </View>
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.role === 'ADMIN' ? 'Mes Commandes Personnelles' : 'Mes Commandes'}
        </Text>
        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminOrders')}
          >
            <Ionicons name="settings-outline" size={20} color="#3b82f6" />
            <Text style={styles.adminButtonText}>Gérer toutes les commandes</Text>
          </TouchableOpacity>
        )}
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={80} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>
            {user?.role === 'ADMIN' ? 'Aucune commande personnelle' : 'Aucune commande'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {user?.role === 'ADMIN' 
              ? 'Vos commandes personnelles apparaîtront ici. Pour gérer toutes les commandes, utilisez le bouton ci-dessus.'
              : 'Vos commandes apparaîtront ici une fois que vous aurez effectué un achat'
            }
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Accueil')}
          >
            <Ionicons name="storefront-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.shopButtonText}>Commencer mes achats</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersCount}>
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </Text>
          </View>
          
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.ordersList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  adminButtonText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  ordersHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  ordersCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderInfo: {
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 8,
  },
  orderItems: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderPayment: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewDetails: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 32,
    lineHeight: 24,
  },
  shopButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});