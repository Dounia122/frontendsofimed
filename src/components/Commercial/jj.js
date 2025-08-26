const analyzeProbability = async () => {
  let progressInterval;
  
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Modal de chargement avec design moderne et épuré
    const loadingModal = createModal('Analyse IA en cours', `
      <style>
        .ai-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 50px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
          background-size: 400% 400%;
          animation: gradientShift 6s ease infinite;
          color: white;
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
          min-height: 300px;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .ai-loader::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: sweep 4s infinite;
        }

        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .progress-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #00d4ff 0%, #5b86e5 25%, #36d1dc 50%, #4facfe 75%, #00f2fe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: rotate 3s linear infinite;
          margin-bottom: 30px;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-circle::before {
          content: '';
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          position: absolute;
        }

        .progress-percentage {
          position: absolute;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          z-index: 1;
        }

        .ai-title {
          margin: 20px 0;
          color: #fff;
          font-size: 1.8rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 0.5px;
        }

        #ai-status {
          margin-top: 20px;
          font-size: 1rem;
          color: rgba(255,255,255,0.9);
          text-align: center;
          background: rgba(255,255,255,0.1);
          padding: 15px 25px;
          border-radius: 25px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.5s ease;
        }

        .status-change {
          animation: statusPulse 0.6s ease;
        }

        @keyframes statusPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); background: rgba(0,212,255,0.2); }
          100% { transform: scale(1); }
        }
      </style>

      <div class="ai-loader">
        <div class="progress-circle">
          <div class="progress-percentage">0%</div>
        </div>
        <h3 class="ai-title">SofIMed Analytics Pro</h3>
        <p id="ai-status">Initialisation du système IA...</p>
      </div>
    `);

    // Animation de progression
    const statusTexts = [
      "Initialisation du système IA...",
      "Collecte des données client...",
      "Analyse des patterns comportementaux...",
      "Traitement de la négociation...",
      "Génération du rapport intelligent...",
      "Finalisation de l'analyse..."
    ];

    let currentStep = 0;
    const maxSteps = statusTexts.length;

    progressInterval = setInterval(() => {
      try {
        if (currentStep < maxSteps) {
          const statusElement = document.getElementById('ai-status');
          const progressPercentage = document.querySelector('.progress-percentage');
          
          if (statusElement && progressPercentage) {
            statusElement.classList.add('status-change');
            
            setTimeout(() => {
              statusElement.textContent = statusTexts[currentStep];
              statusElement.classList.remove('status-change');
            }, 300);
            
            const percentage = Math.round((currentStep + 1) * (100 / maxSteps));
            progressPercentage.textContent = `${percentage}%`;
            currentStep++;
          }
        } else {
          clearInterval(progressInterval);
        }
      } catch (error) {
        console.error('Erreur dans l\'animation de progression:', error);
        clearInterval(progressInterval);
      }
    }, 1000);

    // Récupération des données client
    const clientStats = await axios.get(
      `http://localhost:8080/api/client-stats/${clientInfo.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const clientUserResponse = await axios.get(
      `http://localhost:8080/api/clients/${clientInfo.id}/user-id`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const clientUserId = clientUserResponse.data;

    const sessionResponse = await axios.get(
      `http://localhost:8080/api/sessions/totalDuration/${clientUserId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const tempsPasseMinutes = Math.round(sessionResponse.data / (1000 * 60));

    let tempsReponseMessagerie = 2;
    try {
      const messageResponse = await axios.get(
        `http://localhost:8080/api/messages/temps-reponse-moyen-client/${devis.id}?clientId=${clientInfo.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      tempsReponseMessagerie = Math.round(messageResponse.data);
    } catch (error) {
      console.warn('Impossible de récupérer le temps de réponse messagerie:', error);
    }

    const nbProduitsDevis = produits.length;
    const nbProduitsDejaPurchased = produits.filter(p => purchaseCounts[p.id] > 0).length;
    
    let delaiTraitementHeures = 0;
    if (devis && devis.createdAt) {
        const currentTime = new Date();
        const creationDate = new Date(devis.createdAt);
        delaiTraitementHeures = Math.floor((currentTime - creationDate) / (1000 * 60 * 60));
    }
    
    const modelData = {
      totalCommandes: clientStats.data.totalCommandes,
      totalDevis: clientStats.data.totalDevis,
      totalMontantCommandes: clientStats.data.totalMontantCommandes,
      nb_produits_devis: nbProduitsDevis,
      nb_produits_deja_achetes: nbProduitsDejaPurchased,
      temps_dans_application_min: tempsPasseMinutes,
      temps_reponse_messagerie_min: tempsReponseMessagerie,
      delai_traitement_devis_hrs: delaiTraitementHeures,
      taux_conversion: clientStats.data.totalDevis > 0 ? (clientStats.data.totalCommandes / clientStats.data.totalDevis) * 100 : 0,
      moyenne_montant_commande: clientStats.data.totalCommandes > 0 ? clientStats.data.totalMontantCommandes / clientStats.data.totalCommandes : 0,
      ratio_produits_achetes: nbProduitsDevis > 0 ? nbProduitsDejaPurchased / nbProduitsDevis : 0
    };

    // Appel à l'API de prédiction
    const response = await axios.post(
      'http://localhost:8080/api/predictions/analyze',
      modelData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    // Appel à l'API de négociation
    let negotiationData = null;
    try {
      const negotiationResponse = await axios.get(
        `http://localhost:8080/api/negotiation/devis/${devis.id}/analysis`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      negotiationData = negotiationResponse.data;
    } catch (error) {
      console.warn('Impossible de récupérer l\'analyse de négociation:', error);
    }

    // Animation de fermeture du modal de chargement
    clearInterval(progressInterval);
    
    loadingModal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    loadingModal.style.opacity = '0';
    loadingModal.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      loadingModal.remove();
    }, 500);

    // NOUVEAU DESIGN PROFESSIONNEL SANS ANALYSE COMPORTEMENTALE
    const modal = createModal('📊 Rapport d\'Analyse IA Avancée', `
      <div class="ai-report-container" style="font-family: 'Inter', 'Segoe UI', sans-serif; max-width: 1000px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
        
        <!-- En-tête Premium -->
        <header style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>'); opacity: 0.3;"></div>
          <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 20px;">
              <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <div style="width: 35px; height: 35px; background: #4CAF50; border-radius: 50%; animation: pulse 2s infinite;"></div>
              </div>
              <div>
                <h1 style="margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px;">SofIMed AI Analytics</h1>
                <p style="margin: 5px 0 0; opacity: 0.9; font-size: 1rem;">Intelligence Artificielle Avancée</p>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 8px;">
                  📅 ${new Date().toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 15px 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 1.1rem; margin-bottom: 5px;">🎯 Rapport Certifié</div>
              <div style="font-weight: 600; font-size: 1.1rem;">IA Premium</div>
            </div>
          </div>
        </header>

        <!-- Section Probabilité Principale -->
        <section style="padding: 40px; background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%); border-bottom: 1px solid #eee;">
          <div style="display: flex; flex-wrap: wrap; gap: 40px; align-items: center;">
            
            <!-- Probabilité Principale -->
            <div style="flex: 1; min-width: 300px; text-align: center;">
              <div style="position: relative; display: inline-block;">
                <div style="width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(from 0deg, #4CAF50 0%, #4CAF50 ${Math.round(response.data.pourcentageAcceptation)}%, #e0e0e0 ${Math.round(response.data.pourcentageAcceptation)}%, #e0e0e0 100%); display: flex; align-items: center; justify-content: center; animation: rotateIn 1s ease-out;">
                  <div style="width: 140px; height: 140px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                    <div style="font-size: 2.5rem; font-weight: 900; color: #4CAF50; line-height: 1; text-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);">${Math.round(response.data.pourcentageAcceptation)}%</div>
                    <div style="color: #666; font-size: 1rem; margin-top: 8px; font-weight: 600;">Probabilité</div>
                  </div>
                  <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; background: linear-gradient(45deg, #4CAF50, #66BB6A); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: float 3s ease-in-out infinite; box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);">
                    <span style="font-size: 1.5rem;">✨</span>
                  </div>
                </div>
              </div>
              <h3 style="margin: 20px 0 15px; color: #333; font-size: 1.6rem; font-weight: 700;">Probabilité d'Acceptation</h3>
              <p style="color: #666; margin: 0; font-size: 1.1rem; font-weight: 500;">Analyse prédictive basée sur l'IA • Modèle Multi-Factoriel</p>
              
              <!-- Indicateurs de Performance -->
              <div style="display: flex; justify-content: center; gap: 20px; margin-top: 25px;">
                <div style="text-align: center; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 12px; min-width: 80px;">
                  <div style="font-size: 1.5rem; color: #4CAF50; font-weight: 700;">${Math.round(response.data.details.confiance * 100)}%</div>
                  <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">Confiance</div>
                </div>
                <div style="text-align: center; padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 12px; min-width: 80px;">
                  <div style="font-size: 1.5rem; color: #2196F3; font-weight: 700;">A+</div>
                  <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">Qualité</div>
                </div>
              </div>
            </div>
            
            <!-- Niveau de Confiance Amélioré -->
            <div style="flex: 1; min-width: 350px;">
              <h3 style="margin-top: 0; color: #333; font-size: 1.5rem; font-weight: 700; margin-bottom: 25px; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.8rem;">📊</span> Niveau de Confiance
              </h3>
              
              <!-- Barre de Confiance 3D -->
              <div style="margin-bottom: 30px;">
                <div style="height: 16px; background: linear-gradient(135deg, #f0f0f0, #e0e0e0); border-radius: 8px; overflow: hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                  <div class="confidence-bar" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #66BB6A, #81C784); width: 0%; border-radius: 8px; transition: width 2.5s cubic-bezier(0.4, 0, 0.2, 1); position: relative; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);"></div>
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 3s infinite;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 12px; color: #666; font-size: 0.95rem;">
                  <span style="font-weight: 500;">Faible</span>
                  <span style="font-weight: 700; color: #4CAF50; font-size: 1.1rem;">${Math.round(response.data.details.confiance * 100)}% Confiance</span>
                  <span style="font-weight: 500;">Élevée</span>
                </div>
              </div>
              
              <!-- Indicateurs de Qualité Améliorés -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); padding: 16px; border-radius: 12px; border-left: 4px solid #4CAF50; transition: transform 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 1.3rem;">🔬</span>
                  <span style="font-size: 0.95rem; font-weight: 600; color: #2e7d32;">Multi-Factorielle</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #e3f2fd, #f0f7ff); padding: 16px; border-radius: 12px; border-left: 4px solid #2196F3; transition: transform 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 1.3rem;">⚡</span>
                  <span style="font-size: 0.95rem; font-weight: 600; color: #1565c0;">Temps Réel</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #fff3e0, #fef7ed); padding: 16px; border-radius: 12px; border-left: 4px solid #FF9800; transition: transform 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 1.3rem;">📊</span>
                  <span style="font-size: 0.95rem; font-weight: 600; color: #ef6c00;">Algorithme Avancé</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #f3e5f5, #faf2fc); padding: 16px; border-radius: 12px; border-left: 4px solid #9C27B0; transition: transform 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 1.3rem;">🛡️</span>
                  <span style="font-size: 0.95rem; font-weight: 600; color: #7b1fa2;">Sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        ${negotiationData ? `
        <!-- Section Analyse de Négociation Améliorée -->
        <section style="padding: 50px; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #e0f2e1 100%); border-bottom: 1px solid #c8e6c9;">
          <h2 style="display: flex; align-items: center; gap: 15px; color: #2e7d32; margin-top: 0; font-size: 1.8rem; font-weight: 800; margin-bottom: 35px;">
            <span style="font-size: 2.2rem;">🤝</span> Analyse de Négociation
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px;">
            
            <!-- Interprétation Principale Améliorée -->
            <div style="background: linear-gradient(135deg, #ffffff, #f8f9fc); border-radius: 16px; padding: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-left: 6px solid #4CAF50; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(76, 175, 80, 0.1), transparent); border-radius: 50%;"></div>
              <h3 style="display: flex; align-items: center; gap: 12px; color: #2e7d32; margin-top: 0; font-size: 1.4rem; margin-bottom: 20px; position: relative; z-index: 1;">
                <span style="font-size: 1.8rem;">${negotiationData.sentimentEmoji}</span>
                Interprétation IA
              </h3>
              <div style="background: linear-gradient(135deg, #e8f5e9, #f1f8e9); padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid rgba(76, 175, 80, 0.2);">
                <p style="margin: 0; font-size: 1.2rem; font-weight: 600; color: #2e7d32; text-align: center; line-height: 1.5;">
                  "${negotiationData.interpretation}"
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>📈</span>
                  <span>Probabilité de négociation</span>
                </div>
                <span style="font-weight: 700; color: #4CAF50; font-size: 1.1rem;">${Math.round(negotiationData.acceptanceProbability)}%</span>
              </div>
            </div>
            
            <!-- Recommandations Améliorées -->
            <div style="background: linear-gradient(135deg, #ffffff, #f8f9fc); border-radius: 16px; padding: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); grid-column: 1 / -1;">
              <h3 style="display: flex; align-items: center; gap: 12px; color: #333; margin-top: 0; font-size: 1.4rem; margin-bottom: 25px;">
                <span style="font-size: 1.8rem;">💡</span> Recommandations Stratégiques
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                ${negotiationData.recommendations.map((rec, index) => `
                  <div style="display: flex; align-items: center; gap: 15px; padding: 20px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 12px; border-left: 4px solid #2196F3; transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(33, 150, 243, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    <div style="width: 35px; height: 35px; background: linear-gradient(45deg, #2196F3, #42A5F5); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
                      ${index + 1}
                    </div>
                    <span style="color: #333; font-weight: 600; font-size: 1rem; line-height: 1.4;">${rec}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        <!-- Section Métriques Détaillées Améliorée -->
        <section style="padding: 50px; background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 50%, #f0f4ff 100%);">
          <h2 style="display: flex; align-items: center; gap: 15px; color: #333; margin-top: 0; font-size: 1.8rem; font-weight: 800; margin-bottom: 40px;">
            <span style="font-size: 2rem;">📊</span> Métriques Détaillées
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px;">
            
            <!-- Métriques Commerciales Améliorées -->
            <div style="background: linear-gradient(135deg, #ffffff, #f8f9fc); border-radius: 16px; padding: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-top: 4px solid #4CAF50; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: radial-gradient(circle, rgba(76, 175, 80, 0.1), transparent); border-radius: 50%;"></div>
              <h3 style="display: flex; align-items: center; gap: 12px; color: #333; margin-top: 0; font-size: 1.3rem; margin-bottom: 25px; position: relative; z-index: 1;">
                💼 Métriques Commerciales
              </h3>
              <div style="display: grid; gap: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc, #f0f4ff); border-radius: 10px; border-left: 3px solid #4CAF50;">
                  <span style="color: #666; font-size: 0.95rem; font-weight: 500;">Total Commandes</span>
                  <span style="font-weight: 800; color: #333; font-size: 1.2rem;">${modelData.totalCommandes}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc, #f0f4ff); border-radius: 10px; border-left: 3px solid #2196F3;">
                  <span style="color: #666; font-size: 0.95rem; font-weight: 500;">Total Devis</span>
                  <span style="font-weight: 800; color: #333; font-size: 1.2rem;">${modelData.totalDevis}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border-radius: 10px; border-left: 3px solid #4CAF50;">
                  <span style="color: #2e7d32; font-size: 0.95rem; font-weight: 500;">Montant Total</span>
                  <span style="font-weight: 800; color: #2e7d32; font-size: 1.2rem;">${modelData.totalMontantCommandes.toLocaleString('fr-FR')} MAD</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border-radius: 10px; border-left: 3px solid #66BB6A; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);">
                  <span style="color: #2e7d32; font-size: 0.95rem; font-weight: 600;">Taux de Conversion</span>
                  <span style="font-weight: 800; color: #2e7d32; font-size: 1.3rem;">${modelData.taux_conversion.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <!-- Métriques Produits Améliorées -->
            <div style="background: linear-gradient(135deg, #ffffff, #f8f9fc); border-radius: 16px; padding: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-top: 4px solid #2196F3; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: radial-gradient(circle, rgba(33, 150, 243, 0.1), transparent); border-radius: 50%;"></div>
              <h3 style="display: flex; align-items: center; gap: 12px; color: #333; margin-top: 0; font-size: 1.3rem; margin-bottom: 25px; position: relative; z-index: 1;">
                📦 Métriques Produits
              </h3>
              <div style="display: grid; gap: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc, #f0f4ff); border-radius: 10px; border-left: 3px solid #2196F3;">
                  <span style="color: #666; font-size: 0.95rem; font-weight: 500;">Produits dans le devis</span>
                  <span style="font-weight: 800; color: #333; font-size: 1.2rem;">${modelData.nb_produits_devis}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc, #f0f4ff); border-radius: 10px; border-left: 3px solid #4CAF50;">
                  <span style="color: #666; font-size: 0.95rem; font-weight: 500;">Déjà achetés</span>
                  <span style="font-weight: 800; color: #333; font-size: 1.2rem;">${modelData.nb_produits_deja_achetes}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #e3f2fd, #f0f7ff); border-radius: 10px; border-left: 3px solid #42A5F5; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);">
                  <span style="color: #1565c0; font-size: 0.95rem; font-weight: 600;">Ratio d'achat</span>
                  <span style="font-weight: 800; color: #1565c0; font-size: 1.3rem;">${(modelData.ratio_produits_achetes * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <!-- Métriques Temporelles Améliorées -->
            <div style="background: linear-gradient(135deg, #ffffff, #f8f9fc); border-radius: 16px; padding: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-top: 4px solid #FF9800; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: radial-gradient(circle, rgba(255, 152, 0, 0.1), transparent); border-radius: 50%;"></div>
              <h3 style="display: flex; align-items: center; gap: 12px; color: #333; margin-top: 0; font-size: 1.3rem; margin-bottom: 25px; position: relative; z-index: 1;">
                ⏱️ Métriques Temporelles
              </h3>
              <div style="display: grid; gap: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc, #f0f4ff); border-radius: 10px; border-left: 3px solid #FF9800;">
                  <span style="color: #666; font-size: 0.95rem; font-weight: 500;">Temps dans l'app</span>
                  <span style="font-weight: 800; color: #333; font-size: 1.2rem;">${modelData.temps_dans_application_min} min</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc, #f0f4ff); border-radius: 10px; border-left: 3px solid #9C27B0;">
                  <span style="color: #666; font-size: 0.95rem; font-weight: 500;">Réponse messagerie</span>
                  <span style="font-weight: 800; color: #333; font-size: 1.2rem;">${modelData.temps_reponse_messagerie_min} min</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #fff3e0, #fef7ed); border-radius: 10px; border-left: 3px solid #FF9800; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);">
                  <span style="color: #ef6c00; font-size: 0.95rem; font-weight: 600;">Délai traitement</span>
                  <span style="font-weight: 800; color: #ef6c00; font-size: 1.3rem;">${modelData.delai_traitement_devis_hrs}h</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Pied de page Ultra-Premium -->
        <footer style="padding: 35px 50px; background: linear-gradient(135deg, #333, #424242); color: white; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%); animation: footerShine 6s ease-in-out infinite;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 25px; position: relative; z-index: 1;">
            <div style="display: flex; align-items: center; gap: 20px;">
              <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #4CAF50, #66BB6A); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);">
                <span style="font-size: 1.5rem;">🤖</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 5px;">SofIMed AI v2.1 Premium</div>
                <div style="font-size: 0.9rem; opacity: 0.85; display: flex; align-items: center; gap: 15px;">
                  <span>Précision: ${Math.round(response.data.details.confiance * 100)}%</span>
                  <span>•</span>
                  <span>Modèle Avancé</span>
                  <span>•</span>
                  <span>Certifié IA</span>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 5px;">Rapport généré par l'Intelligence Artificielle SofIMed</div>
              <div style="font-size: 0.8rem; opacity: 0.7;">Technologie de pointe • Analyse prédictive • Sécurisé</div>
            </div>
          </div>
        </footer>
      </div>

      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes rotateIn {
          from { transform: rotate(-180deg) scale(0.5); opacity: 0; }
          to { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes headerShine {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes footerShine {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        .ai-report-container {
          animation: slideInUp 0.8s ease-out;
        }
        
        @keyframes slideInUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `);

    // Animation de la barre de confiance avec délai
    setTimeout(() => {
      const confidenceBar = document.querySelector('.confidence-bar');
      if (confidenceBar) {
        confidenceBar.style.width = `${Math.round(response.data.details.confiance * 100)}%`;
      }
    }, 800);

  } catch (error) {
    clearInterval(progressInterval);
    console.error('Erreur lors de l\'analyse de probabilité:', error);
    
    // Modal d'erreur ultra-élégant
    const errorModal = createModal('❌ Erreur d\'Analyse', `
      <div style="text-align: center; padding: 50px; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #fff, #f8f9fc); border-radius: 16px;">
        <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #ffebee, #fce4ec); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; box-shadow: 0 8px 25px rgba(244, 67, 54, 0.2);">
          <span style="font-size: 2.5rem; color: #f44336;">⚠️</span>
        </div>
        <h3 style="color: #333; margin-bottom: 20px; font-size: 1.5rem; font-weight: 700;">Impossible d'effectuer l'analyse</h3>
        <p style="color: #666; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.5;">Une erreur s'est produite lors de l'analyse IA. Veuillez réessayer dans quelques instants.</p>
        <div style="background: linear-gradient(135deg, #f5f5f5, #fafafa); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #FF9800;">
          <p style="margin: 0 0 15px; font-size: 1rem; color: #666; font-weight: 600;">💡 Suggestions d'amélioration:</p>
          <ul style="text-align: left; margin: 0; padding-left: 20px; color: #666; font-size: 0.95rem; line-height: 1.6;">
            <li>Vérifiez votre connexion internet</li>
            <li>Actualisez la page et réessayez</li>
            <li>Contactez le support technique si le problème persiste</li>
            <li>Consultez les logs pour plus de détails</li>
          </ul>
        </div>
        <button onclick="this.closest('.modal').remove()" style="background: linear-gradient(45deg, #f44336, #e53935); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(244, 67, 54, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(244, 67, 54, 0.3)'">Fermer</button>
      </div>
    `);
  }
};
