import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';

export default function CheckoutScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CARTE');
  const [userInfo, setUserInfo] = useState({
    telephone: '',
    adresse: ''
  });
  const [errors, setErrors] = useState({});
  const { cartItems, getCartTotal, clearCart, loadCart } = useCart();
  const { authenticatedRequest, user } = useAuth();

  const paymentMethods = [
    { id: 'CARTE', name: 'Carte bancaire', icon: 'card-outline' },
    { id: 'ESPECES', name: 'Paiement en espèces', icon: 'cash-outline' },
  ];

  // Charger les informations utilisateur au montage du composant
  useEffect(() => {
    if (user) {
      setUserInfo({
        telephone: user.telephone || '',
        adresse: user.adresse || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!userInfo.telephone.trim()) {
      newErrors.telephone = 'Le numéro de téléphone est obligatoire';
    } else if (!/^[0-9+\-\s()]{8,15}$/.test(userInfo.telephone.trim())) {
      newErrors.telephone = 'Format de téléphone invalide';
    }
    
    if (!userInfo.adresse.trim()) {
      newErrors.adresse = 'L\'adresse de livraison est obligatoire';
    } else if (userInfo.adresse.trim().length < 10) {
      newErrors.adresse = 'L\'adresse doit contenir au moins 10 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateUserInfo = async () => {
    try {
      await authenticatedRequest('/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telephone: userInfo.telephone.trim(),
          adresse: userInfo.adresse.trim()
        }),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      // Ne pas bloquer la commande si la mise à jour du profil échoue
    }
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setLoading(true);

      // Mettre à jour les informations utilisateur
      await updateUserInfo();

      // Créer la commande avec la méthode de paiement
      const orderResponse = await authenticatedRequest(
        `${API_CONFIG.ENDPOINTS.ORDERS}?methodePaiement=${selectedPaymentMethod}`, 
        {
          method: 'POST',
        }
      );

      if (!orderResponse || !orderResponse.id) {
        throw new Error('Erreur lors de la création de la commande');
      }

      // Recharger le panier (il devrait être vide maintenant)
      await loadCart();

      // Afficher le succès et naviguer
      const paymentMethodText = selectedPaymentMethod === 'CARTE' ? 'Carte bancaire' : 'Espèces';
      Alert.alert(
        'Commande confirmée !',
        `Votre commande #${orderResponse.id} a été passée avec succès.\nMontant: ${orderResponse.total.toFixed(2)} €\nPaiement: ${paymentMethodText}\nStatut: En attente`,
        [
          {
            text: 'Voir mes commandes',
            onPress: () => navigation.navigate('Main', { screen: 'Commandes' }),
          },
        ]
      );

    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Erreur de commande',
        error.message || 'Une erreur est survenue lors du traitement de votre commande'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderDeliveryInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informations de livraison</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Numéro de téléphone *</Text>
        <TextInput
          style={[styles.input, errors.telephone && styles.inputError]}
          value={userInfo.telephone}
          onChangeText={(text) => {
            setUserInfo(prev => ({ ...prev, telephone: text }));
            if (errors.telephone) {
              setErrors(prev => ({ ...prev, telephone: null }));
            }
          }}
          placeholder="Ex: +33 6 12 34 56 78"
          keyboardType="phone-pad"
          maxLength={15}
        />
        {errors.telephone && (
          <Text style={styles.errorText}>{errors.telephone}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Adresse de livraison *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.adresse && styles.inputError]}
          value={userInfo.adresse}
          onChangeText={(text) => {
            setUserInfo(prev => ({ ...prev, adresse: text }));
            if (errors.adresse) {
              setErrors(prev => ({ ...prev, adresse: null }));
            }
          }}
          placeholder="Numéro, rue, ville, code postal..."
          multiline
          numberOfLines={3}
          maxLength={255}
        />
        {errors.adresse && (
          <Text style={styles.errorText}>{errors.adresse}</Text>
        )}
      </View>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Résumé de la commande</Text>
      {cartItems.map((item) => (
        <View key={item.id} style={styles.orderItem}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.product?.nom}
          </Text>
          <Text style={styles.itemQuantity}>x{item.quantite}</Text>
          <Text style={styles.itemPrice}>
            {((item.product?.prix || 0) * item.quantite).toFixed(2)} €
          </Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{getCartTotal().toFixed(2)} €</Text>
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Méthode de paiement</Text>
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethod,
            selectedPaymentMethod === method.id && styles.paymentMethodSelected,
          ]}
          onPress={() => setSelectedPaymentMethod(method.id)}
        >
          <Ionicons
            name={method.icon}
            size={24}
            color={selectedPaymentMethod === method.id ? '#6366f1' : '#666'}
          />
          <Text
            style={[
              styles.paymentMethodText,
              selectedPaymentMethod === method.id && styles.paymentMethodTextSelected,
            ]}
          >
            {method.name}
          </Text>
          <Ionicons
            name={selectedPaymentMethod === method.id ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={selectedPaymentMethod === method.id ? '#6366f1' : '#ccc'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Votre panier est vide</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Main', { screen: 'Accueil' })}
        >
          <Text style={styles.shopButtonText}>Retour aux achats</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {renderDeliveryInfo()}
        {renderOrderSummary()}
        {renderPaymentMethods()}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations importantes</Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>
              {selectedPaymentMethod === 'CARTE' 
                ? 'Ceci est une démonstration. Aucun paiement réel ne sera effectué.'
                : 'Paiement en espèces à la livraison. Préparez la monnaie exacte si possible.'
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleCreateOrder}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.confirmButtonText}>
            {loading ? 'Traitement...' : `Confirmer - ${getCartTotal().toFixed(2)} €`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10,
  },
  paymentMethodSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f8faff',
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  paymentMethodTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonIcon: {
    marginRight: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 30,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
});