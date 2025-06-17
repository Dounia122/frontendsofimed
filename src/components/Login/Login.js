import React, { useState, useEffect } from "react";
import "./Login.css";
import sideImage from "../../assets/banner.jpg";
import companyLogo from '../../assets/logosofi1.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';  // Add axios import

// At the top of your file, after imports
// Remove this line as we'll configure it in the request
// axios.defaults.withCredentials = true;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Vérifier s'il y a déjà une session active au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
      // Configurer axios avec le token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Rediriger vers le dashboard approprié
      redirectBasedOnRole(user.role, { userData: user });
    }
  }, []);

  // Fonction de redirection selon le rôle
  const redirectBasedOnRole = (role, state) => {
    switch (role) {
      case 'CLIENT':
        navigate('/client/dashboard', { state, replace: true });
        break;
      case 'COMMERCIAL':
        navigate('/commercial/dashboard', { state, replace: true });
        break;
      case 'ADMIN':
        navigate('/admin/dashboard', { state, replace: true });
        break;
      default:
        setError("Rôle non reconnu");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios({
        method: 'post',
        url: 'http://localhost:8080/api/auth/login',
        data: {
          username: username,
          password: password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.token) {
        // Stocker les données utilisateur
        const userData = {
          id: response.data.user.id,
          token: response.data.token,
          user: response.data.user,
          email: response.data.user.email,
          username: response.data.user.username,
          role: response.data.user.role,
          // Ajouter un timestamp d'expiration (par exemple, 24h)
          expiresAt: new Date().getTime() + (24 * 60 * 60 * 1000)
        };

        // Sauvegarder dans le localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Configurer axios avec le token
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        // Rediriger l'utilisateur
        redirectBasedOnRole(userData.role, { userData });
      } else {
        throw new Error('Authentification échouée');
      }

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        setError("Nom d'utilisateur ou mot de passe incorrect");
      } else if (error.response?.status === 403) {
        setError("Accès non autorisé");
      } else if (error.code === 'ERR_NETWORK') {
        setError("Impossible de contacter le serveur");
      } else {
        setError("Erreur de connexion au serveur");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="form-section">
        <div className="form-card">
          <img src={companyLogo} alt="SOFIMED Logo" className="logo" />
          <h1>Connexion</h1>
          <p className="welcome-message">Accédez à votre espace professionnel</p>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
                aria-label="Nom d'utilisateur"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                aria-label="Mot de passe"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="links">
            <a href="/forgot-password">Mot de passe oublié ?</a>
            <a href="/register">Créer un compte</a>
          </div>
        </div>
      </div>

      <div className="image-section">
        <img src={sideImage} alt="Espace SOFIMED" />
      </div>
    </div>
  );
};

export default Login;
