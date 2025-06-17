import React, { useState } from 'react';
import { FileUp, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';

const NewDevisForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productsDetails: '',
    clientMessage: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // First upload file if exists
      let filePath = null;
      let fileName = null;
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const fileResponse = await axios.post('http://localhost:8080/api/upload', formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          filePath = fileResponse.data.filePath;
          fileName = fileResponse.data.fileName;
        } catch (fileErr) {
          // Handle file upload errors specifically
          if (fileErr.response && fileErr.response.status === 403) {
            throw { response: { status: 403, data: { message: "Accès refusé lors du téléchargement du fichier." } } };
          }
          throw fileErr;
        }
      }
      
      // Then create devis
      const devisResponse = await axios.post('http://localhost:8080/api/devis', {
        clientId: user.id,
        title: formData.title,
        description: formData.description,
        productsDetails: formData.productsDetails,
        clientMessage: formData.clientMessage,
        filePath: filePath,
        fileName: fileName
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess(devisResponse.data);
      }, 1500);
      
    } catch (err) {
      console.error('Erreur lors de la création du devis:', err);
      
      // Handle specific error cases
      if (err.response) {
        if (err.response.status === 403) {
          setError("Accès refusé. Vous n'avez pas les permissions nécessaires pour créer un devis. Veuillez vous reconnecter ou contacter l'administrateur.");
          
          // Add a button to redirect to login
          setTimeout(() => {
            if (window.confirm("Votre session a peut-être expiré. Voulez-vous vous reconnecter?")) {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }, 1000);
        } else if (err.response.status === 400) {
          setError(`Erreur de validation: ${err.response.data.message || "Veuillez vérifier les informations saisies."}`);
        } else {
          setError(`Erreur (${err.response.status}): ${err.response.data.message || "Une erreur est survenue lors de la création de votre demande de devis."}`);
        }
      } else {
        setError('Une erreur de connexion est survenue. Veuillez vérifier votre connexion internet et réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="devis-form-container">
      <h3 className="devis-form-title">Nouvelle demande de devis</h3>
      
      {success ? (
        <div className="success-message">
          <CheckCircle size={32} color="#059669" />
          <p>Votre demande de devis a été créée avec succès!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <p>{error}</p>
              {error.includes("Accès refusé") && (
                <div className="error-actions">
                  <p className="error-help-text">Votre session a peut-être expiré ou vous n'avez pas les droits nécessaires.</p>
                  <button 
                    type="button"
                    className="reconnect-btn"
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/login';
                    }}
                  >
                    Se reconnecter
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="title">Titre de la demande *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Ex: Devis pour pompes industrielles"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Décrivez votre besoin en détail"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="productsDetails">Détails des produits souhaités</label>
            <textarea
              id="productsDetails"
              name="productsDetails"
              className="form-control"
              value={formData.productsDetails}
              onChange={handleChange}
              placeholder="Listez les produits, quantités et spécifications techniques"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="clientMessage">Message complémentaire</label>
            <textarea
              id="clientMessage"
              name="clientMessage"
              className="form-control"
              value={formData.clientMessage}
              onChange={handleChange}
              placeholder="Informations supplémentaires, contraintes, délais..."
            />
          </div>
          
          <div className="form-group">
            <label>Documents complémentaires</label>
            <label className="file-upload" htmlFor="file-input">
              <FileUp className="file-upload-icon" size={20} />
              <div>
                <p className="file-upload-text">Cliquez pour ajouter un fichier</p>
                <p className="file-upload-info">PDF, Word, Excel, Images (max 10MB)</p>
              </div>
              <input
                type="file"
                id="file-input"
                className="file-upload-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </label>
            
            {file && (
              <div className="file-preview">
                <span className="file-preview-name">{file.name}</span>
                <span className="file-preview-size">{formatFileSize(file.size)}</span>
                <button type="button" className="file-preview-remove" onClick={removeFile}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Annuler
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || !formData.title || !formData.description}
            >
              {loading ? (
                <>
                  <Loader size={16} className="spinner" />
                  Envoi en cours...
                </>
              ) : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewDevisForm;