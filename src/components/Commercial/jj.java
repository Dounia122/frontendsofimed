package com.Sofimed.Controller;

import com.Sofimed.Model.Message;
import com.Sofimed.Model.Devis;
import com.Sofimed.Service.MessageService;
import com.Sofimed.DTO.MessageDTO;
import com.Sofimed.Dao.DevisRepository;
import com.Sofimed.Exception.ResourceNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.util.HashMap;
import java.util.Arrays;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(
    origins = "http://localhost:3000",
    allowedHeaders = "*",
    allowCredentials = "true",
    methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.DELETE,
        RequestMethod.OPTIONS
    }
)
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private DevisRepository devisService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/temps-reponse-moyen-client/{devisId}")
    public ResponseEntity<Double> getTempsReponseMoyenClient(@PathVariable Long devisId,
                                                             @RequestParam Long clientId) {
        double tempsMoyen = messageService.calculerTempsReponseMoyenClientt(devisId, clientId);
        return ResponseEntity.ok(tempsMoyen);
    }

    
    @GetMapping("/temps-reponse-moyen/{devisId}")
    public ResponseEntity<Double> getTempsReponseMoyen(@PathVariable Long devisId, 
                                                        @RequestParam Long commercialId) {
        double tempsMoyen = messageService.calculerTempsReponseMoyen(devisId, commercialId);
        return ResponseEntity.ok(tempsMoyen);
    }
    


    @GetMapping("/devis/{devisId}")
    public ResponseEntity<List<MessageDTO>> getMessagesByDevis(@PathVariable Long devisId) {
        List<Message> messages = messageService.findByDevisId(devisId);
        List<MessageDTO> dtos = messages.stream().map(MessageDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Envoyer un nouveau message et notifier via WebSocket
    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(@RequestBody Map<String, Object> messageRequest) {
        try {
            Long devisId = Long.parseLong(messageRequest.get("devisId").toString());
            String content = (String) messageRequest.get("content");
            Long senderId = Long.parseLong(messageRequest.get("senderId").toString());
            String senderName = (String) messageRequest.get("senderName");
            Long recipientId = Long.parseLong(messageRequest.get("recipientId").toString());

            Devis devis = devisService.findById(devisId)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouvé avec l'ID: " + devisId));

            Message message = messageService.saveMessage(devis, senderId, senderName, recipientId, content);
            MessageDTO dto = MessageDTO.fromEntity(message);

            // Notifier les clients connectés au salon du devis via WebSocket
            messagingTemplate.convertAndSend("/topic/messages/" + devisId, dto);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Marquer les messages comme lus
    @PutMapping("/devis/{devisId}/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long devisId,
            @RequestParam(required = false) Long recipientId) {

        try {
            if (recipientId != null) {
                // Marquer comme lus les messages envoyés à un destinataire spécifique
                messageService.markAsReadByRecipient(devisId, recipientId);
            } else {
                // Marquer tous les messages du devis comme lus
                messageService.markAllAsRead(devisId);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Compter les messages non lus
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> countUnreadMessages(
            @RequestParam Long userId,
            @RequestParam(required = false) String userType) {

        try {
            Map<String, Long> counts = messageService.countUnreadMessages(userId, userType);
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Nouvelle méthode pour récupérer le texte de conversation pour l'IA
    @GetMapping("/conversation-text/{devisId}")
    public ResponseEntity<String> getConversationText(@PathVariable Long devisId) {
        try {
            // Récupérer tous les messages du devis
            List<Message> messages = messageService.findByDevisId(devisId);
            
            // Formater les messages en texte pour l'IA
            String conversationText = messages.stream()
                .map(msg -> String.format("%s [%s]: %s", 
                    msg.getSenderName(), 
                    msg.getTimestamp().toString(), 
                    msg.getContent()))
                .collect(Collectors.joining("\n"));
            
            return ResponseEntity.ok(conversationText);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Erreur lors de la récupération des messages");
        }
    }

    // Méthode avancée avec analyse NLP basique
    // Cache pour éviter de recalculer les conversations
    @Cacheable(value = "conversations", key = "#devisId")
    @GetMapping("/processed-conversation/{devisId}")
    public ResponseEntity<Map<String, Object>> getProcessedConversation(@PathVariable Long devisId) {
        try {
            List<Message> messages = messageService.findByDevisId(devisId);
            
            // 1. Texte brut de la conversation
            String rawText = messages.stream()
                .map(Message::getContent)
                .collect(Collectors.joining("\n"));
            
            // 2. Statistiques de base
            Map<String, Object> stats = new HashMap<>();
            stats.put("messageCount", messages.size());
            stats.put("wordCount", rawText.split("\\s+").length);
            stats.put("avgMessageLength", messages.stream()
                .mapToInt(m -> m.getContent().length())
                .average()
                .orElse(0));
            
            // 3. Analyse de sentiment (exemple simple)
            int positiveWords = countKeywords(rawText, Arrays.asList("bon", "excellent", "merci", "parfait", "super", "génial"));
            int negativeWords = countKeywords(rawText, Arrays.asList("problème", "erreur", "mauvais", "difficile", "impossible"));
            
            stats.put("sentimentScore", messages.size() > 0 ? (positiveWords - negativeWords) / (double) messages.size() : 0);
            
            // 4. Mots-clés de négociation
            int negotiationWords = countKeywords(rawText, Arrays.asList("prix", "remise", "réduction", "tarif", "coût"));
            stats.put("negotiationIndicators", negotiationWords);
            
            // 5. Mots-clés d'objection
            int objectionWords = countKeywords(rawText, Arrays.asList("cher", "budget", "réfléchir", "attendre", "comparer"));
            stats.put("objectionIndicators", objectionWords);
            
            // 6. Délais de réponse moyens
            try {
                stats.put("avgResponseTime", messageService.calculerTempsReponseMoyen(devisId, null));
            } catch (Exception e) {
                stats.put("avgResponseTime", 0.0);
            }
            
            return ResponseEntity.ok(Map.of(
                "rawText", rawText,
                "stats", stats
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Méthode utilitaire pour compter les mots-clés
    private int countKeywords(String text, List<String> keywords) {
        return (int) keywords.stream()
            .filter(keyword -> text.toLowerCase().contains(keyword.toLowerCase()))
            .count();
    }

    // Version avec pagination pour les longues conversations
    @GetMapping("/conversation-text/{devisId}")
    public ResponseEntity<String> getConversationText(
        @PathVariable Long devisId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size) {
        
        try {
            // Récupération paginée des messages
            List<Message> messages = messageService.findByDevisIdPaginated(devisId, page, size);
            
            // Formatage pour l'IA
            String conversationText = messages.stream()
                .filter(msg -> msg.getContent().length() > 5) // Filtrer les messages trop courts
                .filter(msg -> !msg.getContent().startsWith("/")) // Exclure les commandes
                .map(msg -> String.format("%s: %s", msg.getSenderName(), msg.getContent()))
                .collect(Collectors.joining("\n"));
            
            return ResponseEntity.ok(conversationText);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Erreur lors de la récupération des messages");
        }
    }
}