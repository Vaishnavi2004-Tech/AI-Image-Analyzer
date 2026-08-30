package com.imageanalyzer.ai_image_analyzer.service;

import nu.pattern.OpenCV;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.videoio.VideoCapture;
import org.opencv.imgcodecs.Imgcodecs;
import org.springframework.stereotype.Service;

@Service
public class CameraService {
    static {
        OpenCV.loadLocally();
    }

    public byte[] captureFrame() {
        VideoCapture camera = new VideoCapture(0); // webcam
        Mat frame = new Mat();
        byte[] result = null;

        if (camera.read(frame)) {
            MatOfByte buffer = new MatOfByte();
            Imgcodecs.imencode(".jpg", frame, buffer);
            result = buffer.toArray();
        }

        camera.release();
        return result;
    }
}