import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_CONFIG } from '../config/api';

export default function AdminOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLoading, setFilterLoading] = useState(false);

  const { authenticatedRequest, user } = useAuth();
  const { getCartItemsCount } = useCart();

  const statusOptions = [
    { key: 'ALL', label: 'Toutes', color: '#6b7280' },
    { key: 'PENDING', label: 'En attente', color: '#f59e0b' },
    { key: 'PAID', label: 'Payées', color: '#10b981' },
    { key: 'SHIPPED', label: 'Expédiées', color: '#3b82f6' },
    { key: 'DELIVERED', label: 'Livrées', color: '#059669' },
  ];

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert('Accès refusé', 'Vous devez être administrateur pour accéder à cette page');
      navigation.goBack();
      return;
    }
    loadOrders();
  }, []);

  // Effet pour recharger les commandes quand le filtre change
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadOrders();
    }
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setFilterLoading(true);
      const endpoint = filterStatus === 'ALL' 
        ? '/orders/admin/all' 
        : `/orders/admin/status/${filterStatus}`;
      
      const response = await authenticatedRequest(endpoint);
      setOrders(response || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await authenticatedRequest(`/orders/admin/${orderId}/status?statut=${newStatus}`, {
        method: 'PUT',
      });
      
      Alert.alert('Succès', 'Statut de la commande mis à jour');
      setModalVisible(false);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.key === status);
    return statusOption ? statusOption.color : '#6b7280';
  };

  const getStatusText = (status) => {
    const statusOption = statusOptions.find(s => s.key === status);
    return statusOption ? statusOption.label : status;
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

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const renderStatusFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Filtrer par statut</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statusOptions.map((status) => {
          const isActive = filterStatus === status.key;
          return (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
                { borderColor: status.color },
                filterLoading && styles.filterButtonDisabled
              ]}
              onPress={() => {
                if (!filterLoading) {
                  setFilterStatus(status.key);
                }
              }}
              disabled={filterLoading}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons 
                  name={status.key === 'ALL' ? 'list' : getStatusIcon(status.key)} 
                  size={16} 
                  color={isActive ? 'white' : status.color} 
                />
                <Text style={[
                  styles.filterButtonText,
                  isActive && styles.filterButtonTextActive
                ]}>
                  {status.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => openOrderDetails(item)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdSection}>
          <Text style={styles.orderId}>Commande #{item.id}</Text>
          <Text style={styles.orderDate}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Ionicons 
            name={getStatusIcon(item.statut)} 
            size={14} 
            color="white" 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {getStatusText(item.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.orderInfoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="pricetag" size={16} color="#6366f1" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Montant</Text>
              <Text style={styles.infoValue}>
                {item.total?.toFixed(2)} €
              </Text>
            </View>
          </View>

          {item.methodePaiement && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons 
                  name={item.methodePaiement === 'CARTE' ? 'card' : 'cash'} 
                  size={16} 
                  color="#10b981" 
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Paiement</Text>
                <Text style={styles.infoValue}>
                  {item.methodePaiement === 'CARTE' ? 'Carte' : 'Espèces'}
                </Text>
              </View>
            </View>
          )}

          {item.orderItems && item.orderItems.length > 0 && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="cube" size={16} color="#f59e0b" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Articles</Text>
                <Text style={styles.infoValue}>
                  {item.orderItems.length} article{item.orderItems.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person" size={16} color="#8b5cf6" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Client</Text>
              <Text style={styles.infoValue}>
                ID #{item.user?.id || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Barre de progression du statut */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'].map((status, index) => {
              const isActive = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'].indexOf(item.statut) >= index;
              const isCurrent = item.statut === status;
              
              return (
                <View key={status} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    isActive && styles.progressDotActive,
                    isCurrent && styles.progressDotCurrent
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(status)} 
                      size={12} 
                      color={isActive ? 'white' : '#ccc'} 
                    />
                  </View>
                  {index < 3 && (
                    <View style={[
                      styles.progressLine,
                      isActive && styles.progressLineActive
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.viewDetails}>Gérer la commande</Text>
          <Text style={styles.footerSubtext}>
            Modifier le statut • Voir les détails
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOrderDetailsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Commande #{selectedOrder?.id}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <>
                <View style={styles.orderDetailsSection}>
                  <Text style={styles.sectionTitle}>Informations</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date :</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedOrder.date)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total :</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.total?.toFixed(2)} €
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Statut actuel :</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.statut) }]}>
                      <Text style={styles.statusText}>
                        {getStatusText(selectedOrder.statut)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderDetailsSection}>
                  <Text style={styles.sectionTitle}>Actions</Text>
                  <Text style={styles.sectionSubtitle}>
                    Changer le statut de la commande :
                  </Text>
                  
                  {statusOptions.slice(1).map((status) => (
                    <TouchableOpacity
                      key={status.key}
                      style={[
                        styles.statusActionButton,
                        selectedOrder.statut === status.key && styles.statusActionButtonDisabled
                      ]}
                      onPress={() => updateOrderStatus(selectedOrder.id, status.key)}
                      disabled={selectedOrder.statut === status.key}
                    >
                      <Ionicons 
                        name={getStatusIcon(status.key)} 
                        size={20} 
                        color={selectedOrder.statut === status.key ? '#ccc' : status.color}
                      />
                      <Text style={[
                        styles.statusActionText,
                        { color: selectedOrder.statut === status.key ? '#ccc' : status.color }
                      ]}>
                        Marquer comme {status.label.toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Gestion des Commandes</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orders.length}</Text>
                <Text style={styles.statLabel}>
                  {filterStatus === 'ALL' ? 'Total' : getStatusText(filterStatus)}
                </Text>
              </View>
              {filterStatus === 'ALL' && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(0)}€
                    </Text>
                    <Text style={styles.statLabel}>Revenus</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? "#ccc" : "#6366f1"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderStatusFilter()}

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {filterStatus === 'ALL' ? 'Aucune commande' : `Aucune commande ${getStatusText(filterStatus).toLowerCase()}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {renderOrderDetailsModal()}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  filterSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterContainer: {
    flexGrow: 0,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: 'white',
    minWidth: 100,
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonDisabled: {
    opacity: 0.6,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  ordersList: {
    padding: 10,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderIdSection: {
    flex: 1,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  orderContent: {
    marginBottom: 16,
  },
  orderInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#6366f1',
  },
  progressDotCurrent: {
    backgroundColor: '#10b981',
    transform: [{ scale: 1.2 }],
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#6366f1',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    padding: 8,
  },
  viewDetails: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDetailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  statusActionButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  statusActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});