package com.Sofimed.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.util.*;
import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "http://localhost:3000")
public class PredictionController {

    private static final Logger logger = LoggerFactory.getLogger(PredictionController.class);
    
    @Autowired
    private MessageController messageController;
    
    private static final Set<String> REQUIRED_NUMERIC_FIELDS = Set.of(
        "totalCommandes", "totalDevis", "totalMontantCommandes",
        "nb_produits_devis", "nb_produits_deja_achetes",
        "temps_dans_application_min", "temps_reponse_messagerie_min",
        "delai_traitement_devis_hrs", "taux_conversion",
        "moyenne_montant_commande", "ratio_produits_achetes"
    );

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeProbability(@RequestBody Map<String, Object> requestData) {
        try {
            logger.info("Requête de prédiction reçue: {}", requestData);

            // Récupérer l'ID du devis pour enrichir avec les messages
            if (requestData.containsKey("devisId")) {
                try {
                    Long devisId = Long.parseLong(requestData.get("devisId").toString());
                    
                    // Récupérer les messages traités
                    ResponseEntity<Map<String, Object>> messagesResponse = 
                        messageController.getProcessedConversation(devisId);
                    
                    if (messagesResponse.getStatusCode().is2xxSuccessful() && messagesResponse.getBody() != null) {
                        Map<String, Object> conversationData = messagesResponse.getBody();
                        
                        // Ajouter le texte des messages
                        String rawText = (String) conversationData.get("rawText");
                        if (rawText != null && !rawText.isEmpty()) {
                            // Limiter à 5000 caractères pour éviter les problèmes de performance
                            requestData.put("messages", rawText.length() > 5000 ? 
                                rawText.substring(0, 5000) + "..." : rawText);
                        }
                        
                        // Ajouter les statistiques de conversation
                        @SuppressWarnings("unchecked")
                        Map<String, Object> stats = (Map<String, Object>) conversationData.get("stats");
                        if (stats != null) {
                            requestData.put("messageCount", stats.get("messageCount"));
                            requestData.put("sentimentScore", stats.get("sentimentScore"));
                            requestData.put("negotiationIndicators", stats.get("negotiationIndicators"));
                            requestData.put("objectionIndicators", stats.get("objectionIndicators"));
                        }
                        
                        logger.info("Messages intégrés avec succès pour le devis {}", devisId);
                    }
                } catch (Exception e) {
                    logger.warn("Impossible de récupérer les messages pour le devis: {}", e.getMessage());
                    // Continue sans les messages
                }
            }

            // Validation des données requises
            Map<String, String> validationErrors = validateRequestData(requestData);
            if (!validationErrors.isEmpty()) {
                return ResponseEntity.badRequest().body(validationErrors);
            }

            // Préparation de la commande Python
            List<String> command = buildPythonCommand(requestData);
            
            // Exécution du script Python
            ProcessResult result = executePythonScript(command);
            
            if (!result.success()) {
                logger.error("Erreur lors de l'exécution Python: {}", result.output());
                return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur du modèle", "details", result.output()));
            }

            // Parsing des résultats
            PredictionResponse response = parsePythonOutput(result.output());
            
            return ResponseEntity.ok(response.toMap());

        } catch (Exception e) {
            logger.error("Erreur système lors de la prédiction", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erreur système", "details", e.getMessage()));
        }
    }

    private Map<String, String> validateRequestData(Map<String, Object> requestData) {
        Map<String, String> errors = new HashMap<>();
        
        // Vérification des champs obligatoires
        for (String field : REQUIRED_NUMERIC_FIELDS) {
            if (!requestData.containsKey(field)) {
                errors.put(field, "Ce champ est obligatoire");
                continue;
            }
            
            try {
                Double.parseDouble(requestData.get(field).toString());
            } catch (NumberFormatException e) {
                errors.put(field, "Doit être un nombre valide");
            }
        }
        
        // Vérification du champ messages (optionnel mais recommandé)
        if (requestData.containsKey("messages") && requestData.get("messages") != null) {
            String messages = requestData.get("messages").toString();
            if (messages.length() > 10000) {
                errors.put("messages", "Le texte des messages ne doit pas dépasser 10000 caractères");
            }
        }
        
        return errors;
    }

    private List<String> buildPythonCommand(Map<String, Object> requestData) throws IOException {
        List<String> command = new ArrayList<>();
        command.add("python");
        
        // Chargement du script Python depuis les ressources
        Resource resource = new ClassPathResource("python/commercial_model.py");
        File pythonFile = resource.getFile();
        
        if (!pythonFile.exists()) {
            throw new FileNotFoundException("Fichier Python introuvable: " + pythonFile.getAbsolutePath());
        }
        
        command.add(pythonFile.getAbsolutePath());
        
        // Ajout des arguments numériques
        REQUIRED_NUMERIC_FIELDS.forEach(field -> {
            command.add("--" + field);
            command.add(requestData.get(field).toString());
        });
        
        // Ajout des messages si présents
        if (requestData.containsKey("messages") && requestData.get("messages") != null) {
            command.add("--messages");
            command.add(escapePythonArgument(requestData.get("messages").toString()));
        }
        
        // Ajout des nouvelles statistiques de conversation
        if (requestData.containsKey("messageCount")) {
            command.add("--messageCount");
            command.add(requestData.get("messageCount").toString());
        }
        
        if (requestData.containsKey("sentimentScore")) {
            command.add("--sentimentScore");
            command.add(requestData.get("sentimentScore").toString());
        }
        
        if (requestData.containsKey("negotiationIndicators")) {
            command.add("--negotiationIndicators");
            command.add(requestData.get("negotiationIndicators").toString());
        }
        
        if (requestData.containsKey("objectionIndicators")) {
            command.add("--objectionIndicators");
            command.add(requestData.get("objectionIndicators").toString());
        }
        
        return command;
    }

    private String escapePythonArgument(String arg) {
        // Échappement basique pour la sécurité
        return arg.replace("\"", "\\\"")
                 .replace("'", "\\'")
                 .replace("`", "\\`")
                 .replace("$", "\\$");
    }

    private ProcessResult executePythonScript(List<String> command) throws IOException, InterruptedException {
        logger.info("Exécution de la commande Python: {}", command);
        
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        
        Process process = pb.start();
        StringBuilder output = new StringBuilder();
        
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                logger.debug("PYTHON> {}", line);
            }
        }
        
        int exitCode = process.waitFor();
        return new ProcessResult(exitCode == 0, output.toString());
    }

    private PredictionResponse parsePythonOutput(String output) {
        try {
            // Le script Python doit retourner du JSON valide
            String jsonOutput = output.trim();
            
            // Trouver la dernière ligne JSON valide
            int lastBrace = jsonOutput.lastIndexOf("}");
            if (lastBrace == -1) {
                throw new RuntimeException("Format de sortie Python invalide");
            }
            
            String json = jsonOutput.substring(0, lastBrace + 1);
            
            // Parse simplifié (utiliser une lib JSON en production)
            Map<String, Object> result = new HashMap<>();
            String[] parts = json.replace("{", "").replace("}", "").replace("\"", "").split(",");
            
            for (String part : parts) {
                String[] kv = part.split(":");
                if (kv.length == 2) {
                    String key = kv[0].trim();
                    String value = kv[1].trim();
                    
                    // Conversion des types basiques
                    if (value.equals("true") || value.equals("false")) {
                        result.put(key, Boolean.parseBoolean(value));
                    } else {
                        try {
                            result.put(key, Double.parseDouble(value));
                        } catch (NumberFormatException e) {
                            result.put(key, value);
                        }
                    }
                }
            }
            
            return new PredictionResponse(result);
            
        } catch (Exception e) {
            logger.error("Erreur lors du parsing de la sortie Python", e);
            throw new RuntimeException("Erreur d'analyse des résultats: " + e.getMessage());
        }
    }

    // Classes internes pour la gestion des résultats
    private record ProcessResult(boolean success, String output) {}
    
    private static class PredictionResponse {
        private final double prediction;
        private final double confidence;
        private final String sentiment;
        private final Map<String, Double> scores;
        private final Map<String, List<String>> keywords;
        
        public PredictionResponse(Map<String, Object> pythonResult) {
            this.prediction = ((Number) pythonResult.getOrDefault("prediction", 0)).doubleValue();
            this.confidence = ((Number) pythonResult.getOrDefault("interest_score", 0.8)).doubleValue();
            this.sentiment = pythonResult.getOrDefault("sentiment", "neutral").toString();
            
            this.scores = new HashMap<>();
            this.scores.put("negotiation", ((Number) pythonResult.getOrDefault("negotiation_score", 0)).doubleValue());
            this.scores.put("objection", ((Number) pythonResult.getOrDefault("objection_score", 0)).doubleValue());
            
            this.keywords = extractKeywords(pythonResult);
        }
        
        private static Map<String, List<String>> extractKeywords(Map<String, Object> result) {
            Map<String, List<String>> keywords = new HashMap<>();
            
            if (result.containsKey("detected_keywords")) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, List<String>> rawKeywords = 
                        (Map<String, List<String>>) result.get("detected_keywords");
                    
                    rawKeywords.forEach((category, words) -> {
                        if (words != null && !words.isEmpty()) {
                            keywords.put(category, new ArrayList<>(words));
                        }
                    });
                } catch (ClassCastException e) {
                    logger.warn("Format des mots-clés invalide", e);
                }
            }
            
            return keywords;
        }
        
        public Map<String, Object> toMap() {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("prediction", this.prediction);
            response.put("confidence", this.confidence);
            response.put("sentiment", this.sentiment);
            response.put("scores", this.scores);
            
            if (!this.keywords.isEmpty()) {
                response.put("keywords", this.keywords);
            }
            
            // Ajout des facteurs clés basés sur l'analyse
            List<String> keyFactors = new ArrayList<>();
            if (this.prediction > 70) keyFactors.add("Fort potentiel d'acceptation");
            if (this.scores.get("negotiation") > 0.5) keyFactors.add("Client en négociation");
            if (this.scores.get("objection") > 0.3) keyFactors.add("Objections à traiter");
            if (this.sentiment.equals("positive")) keyFactors.add("Sentiment positif");
            
            response.put("keyFactors", keyFactors);
            
            return response;
        }
    }
}