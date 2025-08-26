import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import './AlertComponent.css';

const AlertComponent = ({ type, message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <AlertCircle size={24} />;
      default:
        return <AlertCircle size={24} />;
    }
  };

  return (
    <div className={`alert-overlay ${isAnimating ? 'animate-in' : 'animate-out'}`}>
      <div className={`alert-container alert-${type}`}>
        <div className="alert-content">
          <div className="alert-icon">
            {getIcon()}
          </div>
          <div className="alert-message">
            <h4 className="alert-title">
              {type === 'success' ? 'Succès' : 'Erreur'}
            </h4>
            <p className="alert-text">{message}</p>
          </div>
        </div>
        <button className="alert-close" onClick={handleClose}>
          <X size={20} />
        </button>
        <div className={`alert-progress alert-progress-${type}`}></div>
      </div>
    </div>
  );
};

export default AlertComponent;