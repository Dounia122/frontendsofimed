import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './produit.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';

const initialFormState = {
  id: null,
  nom: '',
  reference: '',
  sku: '',
  marque: { id: '', nom: '' },
  departement: { id: '', nom: '' },
  categorie: { id: '', nom: '' },
  description: '',
  statut: 'ACTIF',
  imageFile: null,
  ficheTechniqueFile: null,
  imageUrl: '',
  ficheTechnique: ''
};

const ProductManager = () => {
  const [marques, setMarques] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mode, setMode] = useState('create');

  // Fonction pour charger les données depuis l'API
  const fetchData = async (endpoint, setter) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:8080/api/${endpoint}`);
      setter(response.data);
      setError(null);
    } catch (err) {
      console.error(`Erreur lors du chargement des ${endpoint}:`, err);
      setError(`Erreur lors du chargement des ${endpoint}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions spécifiques pour chaque type de données
  const fetchMarques = useCallback(() => fetchData('marques', setMarques), []);
  const fetchCategories = useCallback(() => fetchData('categories', setCategories), []);
  
  // Pour les départements, on suppose qu'ils sont gérés par une API similaire
  const fetchDepartements = useCallback(() => {
    return fetchData('departements', setDepartements);
  }, []);

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchMarques(),
        fetchDepartements(),
        fetchCategories()
      ]);
    };
    
    loadData();
  }, [fetchMarques, fetchDepartements, fetchCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:8080/api/produits/search?q=${searchTerm}`);
      setSearchResults(response.data);
      setShowSearchResults(true);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setError('Erreur lors de la recherche');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setForm({
      ...product,
      marque: product.marque || { id: '', nom: '' },
      departement: product.departement || { id: '', nom: '' },
      categorie: product.categorie || { id: '', nom: '' },
      imageFile: null,
      ficheTechniqueFile: null,
      imageUrl: product.imageUrl || '',
      ficheTechnique: product.ficheTechnique || ''
    });
    setMode('edit');
    setShowSearchResults(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const formData = new FormData();

        // Ajout des champs texte
        formData.append('nom', form.nom);
        formData.append('reference', form.reference);
        formData.append('sku', form.sku);
        formData.append('marqueId', form.marque.id);
        formData.append('departementId', form.departement.id);
        formData.append('categorieId', form.categorie.id);
        formData.append('description', form.description);
        formData.append('statut', form.statut);

        // Ajout des fichiers
        if (form.imageFile) {
            formData.append('image', form.imageFile);
        }
        if (form.ficheTechniqueFile) {
            formData.append('ficheTechnique', form.ficheTechniqueFile);
        }

        let response;
        if (mode === 'create') {
            response = await axios.post('http://localhost:8080/api/produits', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Produit créé avec succès');
        } else {
            response = await axios.put(`http://localhost:8080/api/produits/${form.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Produit mis à jour avec succès');
        }

        // Vérification de la réponse
        if (response.data && response.data.success) {
            setSuccess(mode === 'create' ? 'Produit créé avec succès' : 'Produit mis à jour avec succès');
            resetForm();
        } else {
            setError(response.data.message || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        setError(error.response?.data?.message || 'Erreur lors de la sauvegarde du produit');
    } finally {
        setIsLoading(false);
    }
};

const handleDelete = async () => {
    if (!form.id || !window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
        setIsLoading(true);
        const response = await axios.delete(`http://localhost:8080/api/produits/${form.id}`);
        
        if (response.data && response.data.success) {
            setSuccess('Produit supprimé avec succès');
            resetForm();
        } else {
            setError(response.data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError(error.response?.data?.message || 'Erreur lors de la suppression du produit');
    } finally {
        setIsLoading(false);
    }
};

  const resetForm = () => {
    setForm(initialFormState);
    setError(null);
    setSuccess(null);
    setMode('create');
  };

  return (
    <div className="product-manager-container">
      <div className="search-section">
        <div className="page-title">
          <div className="title-icon-container">
            <FontAwesomeIcon icon={faClipboardList} className="title-icon" />
          </div>
          <h1>Gestion des Produits</h1>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={isLoading || !searchTerm.trim()}
          >
            {isLoading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {showSearchResults && (
          <div className="search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map(product => (
                  <li key={product.id} onClick={() => handleSelectProduct(product)}>
                    {product.nom} - {product.reference}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun résultat trouvé</p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-header">
          <h2>{mode === 'create' ? 'Ajouter un produit' : 'Modifier un produit'}</h2>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'En cours...' : mode === 'create' ? 'Ajouter' : 'Mettre à jour'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Supprimer
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isLoading}>
              Annuler
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="close-alert" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
            <button className="close-alert" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <div className="form-grid">
          <fieldset className="form-section">
            <legend>Informations générales</legend>
            <div className="form-group">
              <label>
                Nom du produit*
                <input type="text" name="nom" value={form.nom} onChange={handleChange} required />
              </label>

              <label>
                Référence*
                <input type="text" name="reference" value={form.reference} onChange={handleChange} required />
              </label>

              <label>
                SKU*
                <input type="text" name="sku" value={form.sku} onChange={handleChange} required />
              </label>

              <label>
                Description
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
              </label>

              <label>
                Statut
                <select name="statut" value={form.statut} onChange={handleChange}>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </label>

              <label>
                Image du produit
                <input
                  type="file"
                  name="imageFile"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {form.imageUrl && !form.imageFile && (
                  <div className="file-preview">
                    <span>Image actuelle: {form.imageUrl}</span>
                  </div>
                )}
              </label>

              <label>
                Fiche Technique (PDF)
                <input
                  type="file"
                  name="ficheTechniqueFile"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                {form.ficheTechnique && !form.ficheTechniqueFile && (
                  <div className="file-preview">
                    <span>Fiche actuelle: {form.ficheTechnique}</span>
                  </div>
                )}
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Relations</legend>
            <div className="form-group">
              <label>
                Marque
                <select 
                  name="marque.id" 
                  value={form.marque.id} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner une marque</option>
                  {marques.map(marque => (
                    <option key={marque.id} value={marque.id}>
                      {marque.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Département
                <select 
                  name="departement.id" 
                  value={form.departement.id} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner un département</option>
                  {departements.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Catégorie
                <select 
                  name="categorie.id" 
                  value={form.categorie.id} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        </div>
      </form>
    </div>
  );
};

export default ProductManager;