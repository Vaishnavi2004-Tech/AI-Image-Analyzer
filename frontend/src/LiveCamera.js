import React, { useRef, useEffect, useState, useCallback } from "react";
import "./UploadImage.css";

function LiveCamera({ onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start webcam
  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        setError("Check camera connection and browser permissions.");
      }
    }
    startCamera();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture frame → analyze
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || loading) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      try {
        const response = await fetch("http://localhost:8090/api/analyze", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Server error: " + response.status);
        const data = await response.json();
        setResult(data);
      } catch (err) {
        console.error("Analyze failed:", err);
        setError("Analysis failed: " + err.message);
      } finally {
        setLoading(false);
      }
    }, "image/jpeg", 0.92);
  }, [loading]);

  // Optional gender detection
  const detectGender = async () => {
    if (!canvasRef.current) return;
    const blob = await new Promise((resolve) =>
      canvasRef.current.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) return;
    const formData = new FormData();
    formData.append("file", blob, "capture.jpg");

    try {
      const response = await fetch("http://localhost:8090/api/gender", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Server error: " + response.status);
      const data = await response.json();
      setResult(prev => ({
        ...prev,
        gender: data.gender,
        genderConfidence: data.genderConfidence
      }));
    } catch (err) {
      console.error("Gender detection failed:", err);
      setError("Gender detection failed: " + err.message);
    }
  };

  // Spacebar shutter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        captureAndAnalyze();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [captureAndAnalyze]);

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onClose();
  };

  return (
    <div className="upload-container">
      <h2>Live Camera Detection</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="preview-wrapper">
        <video ref={videoRef} autoPlay playsInline muted style={{ maxWidth: "100%", borderRadius: "8px" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div style={{ marginTop: "12px" }}>
        <button onClick={captureAndAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Capture (Spacebar)"}
        </button>
        <button onClick={detectGender} disabled={!result} style={{ marginLeft: "10px" }}>
          Detect Gender
        </button>
        <button onClick={handleClose} style={{ marginLeft: "10px" }}>
          Close
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h2>Analysis Result</h2>
          {result.gender && (
            <>
            <h3>Gender</h3>
            <div className="card gender-card">
              <p>{result.gender} ({(result.genderConfidence).toFixed(1)}%)</p>
            </div>
            </>
          )}
          <h3>Description</h3>
          <div className="card description-card">
            <p>{result.description}</p>
          </div>
          <h3>Detected Objects</h3>
          <div className="card objects-card">
            <ul>
              {(result.objects || [])
                .filter((o) => o.conf > 0.3)
                .map((o, i) => (
                  <li key={i}>{o.label} - {(o.conf * 100).toFixed(1)}%</li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveCamera;
