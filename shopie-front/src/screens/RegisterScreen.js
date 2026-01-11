import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  // Références pour la navigation entre les champs
  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);
  const confirmPasswordRef = React.useRef(null);

  const handleRegister = async () => {
    if (!nom || !email || !motDePasse || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (motDePasse !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (motDePasse.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const result = await register(nom, email, motDePasse);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erreur d\'inscription', result.error || 'Une erreur est survenue');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6']}
          style={styles.backgroundGradient}
        >
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </LinearGradient>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.logoGradient}
              >
                <Ionicons name="storefront" size={32} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>Shopie</Text>
            <Text style={styles.welcomeText}>Créez votre compte</Text>
            <Text style={styles.subtitleText}>
              Rejoignez notre communauté et découvrez des produits exceptionnels
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Informations personnelles</Text>
              <View style={styles.formDivider} />
            </View>

            {/* Formulaire simplifié */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.simpleInput}
                placeholder="Entrez votre nom complet"
                value={nom}
                onChangeText={setNom}
                placeholderTextColor="#999"
                autoComplete="name"
                textContentType="name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse email</Text>
              <TextInput
                ref={emailRef}
                style={styles.simpleInput}
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  placeholder="Minimum 6 caractères"
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.simpleEyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#1e40af" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.passwordInput}
                  placeholder="Répétez votre mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#999"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.simpleEyeButton}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#1e40af" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password strength indicator */}
            <View style={styles.passwordStrength}>
              <View style={styles.strengthIndicator}>
                <View style={[
                  styles.strengthBar,
                  motDePasse.length >= 6 && styles.strengthBarActive
                ]} />
                <View style={[
                  styles.strengthBar,
                  motDePasse.length >= 8 && styles.strengthBarActive
                ]} />
                <View style={[
                  styles.strengthBar,
                  motDePasse.length >= 10 && /[A-Z]/.test(motDePasse) && styles.strengthBarActive
                ]} />
              </View>
              <Text style={styles.strengthText}>
                {motDePasse.length < 6 ? 'Faible' : 
                 motDePasse.length < 8 ? 'Moyen' : 'Fort'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#9ca3af', '#9ca3af'] : ['#2563eb', '#1d4ed8']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <View style={styles.loadingSpinner} />
                    <Text style={styles.buttonText}>Création en cours...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="white" />
                    <Text style={styles.buttonText}>Créer mon compte</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={styles.linkText}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.linkText}>Politique de confidentialité</Text>
            </Text>
          </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 100,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 200,
    right: 50,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  formDivider: {
    height: 3,
    backgroundColor: '#1e40af',
    borderRadius: 2,
    width: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  simpleInput: {
    borderWidth: 2,
    borderColor: '#1e40af',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1f2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e40af',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  simpleEyeButton: {
    padding: 12,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -8,
  },
  strengthIndicator: {
    flexDirection: 'row',
    marginRight: 12,
  },
  strengthBar: {
    width: 20,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 4,
  },
  strengthBarActive: {
    backgroundColor: '#1e40af',
  },
  strengthText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    marginRight: 8,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  loginSection: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  loginButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: 'white',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});