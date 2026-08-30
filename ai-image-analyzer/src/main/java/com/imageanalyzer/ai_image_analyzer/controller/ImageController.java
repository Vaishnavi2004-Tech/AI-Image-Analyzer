package com.imageanalyzer.ai_image_analyzer.controller;

import java.io.IOException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.imageanalyzer.ai_image_analyzer.Entity.AnalysisResult;
import com.imageanalyzer.ai_image_analyzer.Repository.AnalysisResultRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class ImageController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private AnalysisResultRepository analysisResultRepository;

    private HttpEntity<MultiValueMap<String, Object>> buildRequest(MultipartFile file) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });
        return new HttpEntity<>(body, headers);
    }

    // Fast analysis (YOLO + BLIP) — saves a new row, returns the row's id to the frontend
    @PostMapping("/analyze")
    public ResponseEntity<String> analyzeImage(@RequestParam("file") MultipartFile file) throws IOException {
        HttpEntity<MultiValueMap<String, Object>> requestEntity = buildRequest(file);
        String response = restTemplate.postForObject("http://localhost:5000/analyze", requestEntity, String.class);

        Long savedId = null;
        try {
            savedId = saveToDatabase(response);
        } catch (Exception e) {
            System.out.println("Could not save analysis to DB: " + e.getMessage());
        }

        // attach the saved DB id to the JSON response so the frontend can reference it later
        String responseWithId = attachId(response, savedId);
        return ResponseEntity.ok(responseWithId);
    }

    // Gender detection — updates the existing DB row identified by dbId (if provided)
    @PostMapping("/gender")
    public ResponseEntity<String> detectGender(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dbId", required = false) Long dbId) throws IOException {

        HttpEntity<MultiValueMap<String, Object>> requestEntity = buildRequest(file);
        String response = restTemplate.postForObject("http://localhost:5000/gender", requestEntity, String.class);

        if (dbId != null) {
            try {
                updateGenderInDatabase(dbId, response);
            } catch (Exception e) {
                System.out.println("Could not update gender in DB: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(response);
    }

    private Long saveToDatabase(String flaskJson) throws IOException {
        JsonNode node = objectMapper.readTree(flaskJson);

        AnalysisResult entity = new AnalysisResult();
        entity.setDescription(node.path("description").asText(null));
        entity.setObjectsJson(node.path("objects").toString());
        entity.setObjectCount(node.path("count").asInt(0));
        entity.setImageWidth(node.path("imageWidth").asInt(0));
        entity.setImageHeight(node.path("imageHeight").asInt(0));

        AnalysisResult saved = analysisResultRepository.save(entity);
        return saved.getId();
    }

    private void updateGenderInDatabase(Long id, String genderJson) throws IOException {
        JsonNode node = objectMapper.readTree(genderJson);
        String gender = node.path("gender").isNull() ? null : node.path("gender").asText(null);
        Double genderConfidence = node.has("genderConfidence") && !node.path("genderConfidence").isNull()
                ? node.path("genderConfidence").asDouble()
                : null;

        analysisResultRepository.findById(id).ifPresent(entity -> {
            entity.setGender(gender);
            entity.setGenderConfidence(genderConfidence);
            analysisResultRepository.save(entity);
        });
    }

    // Adds a "dbId" field into the /analyze JSON response before sending it back to the frontend
    private String attachId(String flaskJson, Long id) throws IOException {
        JsonNode node = objectMapper.readTree(flaskJson);
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            objectNode.put("dbId", id);
            return objectMapper.writeValueAsString(objectNode);
        }
        return flaskJson;
    }
}