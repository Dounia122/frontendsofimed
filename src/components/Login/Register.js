import React, { useState } from "react";
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
    companyName: ""  // Add company name field
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Add phone number validation
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
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Votre email"
                />
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

            <button type="submit" className="login-btn" disabled={loading}>
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