package com.imageanalyzer.ai_image_analyzer.Repository;

import com.imageanalyzer.ai_image_analyzer.Entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    // Newest first
    List<AnalysisResult> findAllByOrderByCreatedAtDesc();
}