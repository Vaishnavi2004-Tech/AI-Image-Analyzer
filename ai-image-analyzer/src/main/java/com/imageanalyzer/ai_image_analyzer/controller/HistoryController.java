package com.imageanalyzer.ai_image_analyzer.controller;

import com.imageanalyzer.ai_image_analyzer.Entity.AnalysisResult;
import com.imageanalyzer.ai_image_analyzer.Repository.AnalysisResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private AnalysisResultRepository analysisResultRepository;

    // GET all saved analyses, newest first
    @GetMapping
    public List<AnalysisResult> getHistory() {
        return analysisResultRepository.findAllByOrderByCreatedAtDesc();
    }

    // GET a single saved analysis by id
    @GetMapping("/{id}")
    public AnalysisResult getOne(@PathVariable Long id) {
        return analysisResultRepository.findById(id).orElse(null);
    }

    // DELETE a saved analysis by id
    @DeleteMapping("/{id}")
    public void deleteOne(@PathVariable Long id) {
        analysisResultRepository.deleteById(id);
    }
}