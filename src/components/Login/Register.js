import React, { useState, useEffect } from "react";
import "./Register.css";
import sideImage from "../../assets/banner.jpg";
import companyLogo from '../../assets/logosofi1.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configuration de l'instance Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Fonction de validation d'email avancée
const validateEmailAdvanced = async (email) => {
  // 1. Validation du format de base
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Format d'email invalide" };
  }

  // 2. Validation des caractères interdits
  const forbiddenChars = /[<>()\[\]\\,;:\s@"]/;
  const localPart = email.split('@')[0];
  if (forbiddenChars.test(localPart.replace(/[._%+-]/g, ''))) {
    return { isValid: false, message: "Caractères non autorisés dans l'email" };
  }

  // 3. Validation de la longueur
  if (email.length > 254 || localPart.length > 64) {
    return { isValid: false, message: "Email trop long" };
  }

  // 4. Validation du domaine
  const domain = email.split('@')[1];
  if (!domain || domain.length < 3) {
    return { isValid: false, message: "Domaine invalide" };
  }

  // 5. Vérification des domaines temporaires/jetables
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'yopmail.com', 'temp-mail.org',
    'throwaway.email', 'getnada.com', 'maildrop.cc'
  ];
  
  if (disposableDomains.includes(domain.toLowerCase())) {
    return { isValid: false, message: "Les emails temporaires ne sont pas autorisés" };
  }

  // 6. Vérification DNS du domaine (optionnel - nécessite un service backend)
  try {
    const domainCheck = await axiosInstance.get(`/auth/verify-domain/${domain}`);
    if (!domainCheck.data.exists) {
      return { isValid: false, message: "Le domaine email n'existe pas" };
    }
  } catch (error) {
    console.warn('Impossible de vérifier le domaine:', error);
    // Continue sans bloquer si le service n'est pas disponible
  }

  return { isValid: true, message: "Email valide" };
};

// Fonction pour vérifier si l'email existe déjà dans la base
const checkEmailExists = async (email) => {
  try {
    const response = await axiosInstance.get(`/auth/check-email/${encodeURIComponent(email)}`);
    return response.data.exists;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    return false;
  }
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
    companyName: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState({
    isValidating: false,
    isValid: null,
    message: "",
    exists: false
  });

  // Validation en temps réel de l'email
  useEffect(() => {
    const validateEmail = async () => {
      if (formData.email.length > 3) {
        setEmailValidation(prev => ({ ...prev, isValidating: true }));
        
        // Validation du format et de la structure
        const validation = await validateEmailAdvanced(formData.email);
        
        if (validation.isValid) {
          // Vérifier si l'email existe déjà
          const exists = await checkEmailExists(formData.email);
          setEmailValidation({
            isValidating: false,
            isValid: !exists,
            message: exists ? "Cet email est déjà utilisé" : "Email valide",
            exists: exists
          });
        } else {
          setEmailValidation({
            isValidating: false,
            isValid: false,
            message: validation.message,
            exists: false
          });
        }
      } else {
        setEmailValidation({
          isValidating: false,
          isValid: null,
          message: "",
          exists: false
        });
      }
    };

    const timeoutId = setTimeout(validateEmail, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    if (!formData.phoneNumber.trim()) {
      setError("Le numéro de téléphone est obligatoire.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || 
        !formData.username.trim() || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    // Validation de l'email
    if (!emailValidation.isValid) {
      setError(emailValidation.message || "Email invalide");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/auth/register', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        phone: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        companyName: formData.companyName.trim(),
        role: 'CLIENT'
      });

      console.log('Registration response:', response.data);
      
      if (response.data.clientCode) {
        setSuccess(`Compte créé avec succès ! Code client: ${response.data.clientCode}`);
      } else {
        setSuccess('Compte créé avec succès !');
      }
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError("Nom d'utilisateur ou email déjà utilisé");
      } else if (err.response?.status === 403) {
        setError("Erreur d'autorisation. Veuillez réessayer.");
      } else {
        setError("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="form-section">
        <div className="form-card-wide">
          <img src={companyLogo} alt="SOFIMED Logo" className="logo" />
          <h1>Créer un compte</h1>
          <p className="welcome-message">Rejoignez notre plateforme professionnelle</p>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="firstName">Prénom *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                />
              </div>

              <div className="input-group">
                <label htmlFor="lastName">Nom *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="email">Email *</label>
                <div className="email-input-container">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Votre email"
                    className={`email-input ${
                      emailValidation.isValid === true ? 'valid' : 
                      emailValidation.isValid === false ? 'invalid' : ''
                    }`}
                  />
                  <div className="email-validation-indicator">
                    {emailValidation.isValidating && (
                      <span className="validating">🔄</span>
                    )}
                    {emailValidation.isValid === true && (
                      <span className="valid-icon">✅</span>
                    )}
                    {emailValidation.isValid === false && (
                      <span className="invalid-icon">❌</span>
                    )}
                  </div>
                </div>
                {emailValidation.message && (
                  <p className={`email-message ${
                    emailValidation.isValid ? 'success' : 'error'
                  }`}>
                    {emailValidation.message}
                  </p>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="username">Nom d'utilisateur *</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Votre pseudo"
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="password">Mot de passe *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmation *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="phoneNumber">Téléphone *</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Votre téléphone"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="companyName">Nom de l'entreprise</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Nom de votre entreprise"
                />
              </div>
            </div>

            <div className="input-group full-width">
              <label htmlFor="address">Adresse</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                placeholder="Votre adresse"
              />
            </div>

            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading || !emailValidation.isValid || emailValidation.isValidating}
            >
              {loading ? "En cours..." : "S'inscrire"}
            </button>
          </form>

          <div className="links">
            <a href="/login">Déjà un compte ? Se connecter</a>
          </div>
        </div>
      </div>

      <div className="image-section">
        <img src={sideImage} alt="Espace SOFIMED" />
      </div>
    </div>
  );
};

export default Register;