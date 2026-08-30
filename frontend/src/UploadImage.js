import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./UploadImage.css";
import LiveCamera from "./LiveCamera";
import History from "./History";



function UploadImage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setTooltip(null);
  };

  // Fast analysis (YOLO + BLIP)
  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8090/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Server error: " + response.status);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Analysis failed: " + err.message);
    }
  };

  // Optional gender detection
const handleGenderDetect = async () => {
  if (!selectedFile) return;
  const formData = new FormData();
  formData.append("file", selectedFile);

  // send the saved record's id so backend updates that same row
  if (result && result.dbId) {
    formData.append("dbId", result.dbId);
  }

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
    alert("Gender detection failed: " + err.message);
  }
};

  const [showHistory, setShowHistory] = useState(false);

  const handleDownloadPDF = () => {
  if (!result || !canvasRef.current) return;
  const doc = new jsPDF();

  const purple = [101, 30, 119];
  const lightGray = [247, 247, 249];
  const borderGray = [220, 220, 224];
  const darkGray = [55, 55, 60];
  const green = [39, 174, 96];
  const orange = [211, 84, 0];

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ---------- Header band ----------
  doc.setFillColor(...purple);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("AI Image Analyzer Report", margin, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(now.toLocaleString(), pageWidth - margin, 16, { align: "right" });
  y = 40;

  // ---------- Section helper ----------
  const sectionHeading = (label) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...purple);
    doc.text(label.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(...purple);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + 30, y);
    y += 7;
  };

  // ---------- Gender ----------
  if (result.gender) {
    sectionHeading("Gender");
    doc.setDrawColor(...borderGray);
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, contentWidth, 12, 1, 1, "FD");
    doc.setFontSize(10.5);
    doc.setTextColor(...darkGray);
    doc.setFont("helvetica", "normal");
    doc.text(`${result.gender}`, margin + 4, y + 8);
    const confColor = result.genderConfidence > 70 ? green : orange;
    doc.setTextColor(...confColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${result.genderConfidence.toFixed(1)}%`, pageWidth - margin - 4, y + 8, { align: "right" });
    y += 22;
  }

  // ---------- Description ----------
  sectionHeading("Description");
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(result.description || "", contentWidth - 8);
  const descHeight = descLines.length * 5.5 + 8;
  doc.setDrawColor(...borderGray);
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentWidth, descHeight, 1, 1, "FD");
  doc.setTextColor(...darkGray);
  doc.text(descLines, margin + 4, y + 7);
  y += descHeight + 10;

  // ---------- Annotated image ----------
  sectionHeading("Annotated Image");
  const imgData = canvasRef.current.toDataURL("image/png");
  const imgProps = doc.getImageProperties(imgData);
  const imgWidth = contentWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width; // maintain aspect ratio
  doc.setDrawColor(...borderGray);
  doc.rect(margin, y, imgWidth, imgHeight);
  doc.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
  y += imgHeight + 10;

  // ---------- Detected objects table ----------
  sectionHeading("Detected Objects");

  autoTable(doc, {
  head: [["Object", "Confidence"]],
  body: (result.objects || []).filter(o => o.conf > 0.3).map(o => [
    o.label.charAt(0).toUpperCase() + o.label.slice(1),
    (o.conf * 100).toFixed(1) + "%"
  ]),
  startY: y,
  styles: { fontSize: 10 },
  headStyles: { fillColor: purple, textColor: [255,255,255] },
  alternateRowStyles: { fillColor: lightGray },
  didDrawPage: function () {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by AI Image Analyzer © Vaishnavi",
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }
});

  y = doc.lastAutoTable.finalY + 10;

  // ---------- Total count ----------
  doc.setFillColor(...purple);
  doc.roundedRect(margin, y, contentWidth, 11, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Objects Detected: ${(result.objects || []).filter(o => o.conf > 0.3).length}`, margin + 4, y + 7.5);

  doc.save("analysis_result.pdf");
};

  useEffect(() => {
  if (result && preview) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imgElement = document.getElementById("preview-img");

    // Match canvas size to rendered <img> size (not natural size)
    canvas.width = imgElement.clientWidth;
    canvas.height = imgElement.clientHeight;

    const tempImg = new Image();
    tempImg.src = preview;

    tempImg.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / result.imageWidth;
      const scaleY = canvas.height / result.imageHeight;

      const colors = ["red", "blue", "green", "orange", "purple"];

      (result.objects || [])
        .filter(obj => obj.conf > 0.3)
        .forEach((obj, index) => {
          const color = colors[index % colors.length];
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;

          ctx.strokeRect(
            obj.x * scaleX,
            obj.y * scaleY,
            obj.width * scaleX,
            obj.height * scaleY
          );

          const fontSize = Math.max(10, canvas.width / 80);
          ctx.font = `${fontSize}px Arial`;
          const text = `${obj.label} (${(obj.conf * 100).toFixed(1)}%)`;
          const textWidth = ctx.measureText(text).width;

          const labelY = obj.y * scaleY > fontSize + 10
            ? obj.y * scaleY - (fontSize + 10)
            : obj.y * scaleY;

          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(obj.x * scaleX, labelY, textWidth + 10, fontSize + 6);

          ctx.fillStyle = "white";
          ctx.fillText(text, obj.x * scaleX + 5, labelY + fontSize);
        });
    };
  }
}, [result, preview]);


  const handleMouseMove = (e) => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const scaleX = canvas.width / result.imageWidth;
    const scaleY = canvas.height / result.imageHeight;

    const hovered = (result.objects || [])
      .filter(obj => obj.conf > 0.3)
      .find(
        (obj) =>
          x >= obj.x * scaleX &&
          x <= (obj.x + obj.width) * scaleX &&
          y >= obj.y * scaleY &&
          y <= (obj.y + obj.height) * scaleY
      );

    if (hovered) {
      setTooltip({
        text: `${hovered.label} (${(hovered.conf * 100).toFixed(1)}%)`,
        x: e.clientX,
        y: e.clientY,
      });
    } else {
      setTooltip(null);
    }
  };

  if (showCamera) {
    return <LiveCamera onClose={() => setShowCamera(false)} />;
  }

  if (showHistory) {
  return <History onClose={() => setShowHistory(false)} />;
}

  return (
    <div className="upload-container">
      <h2>AI Image Analyzer</h2>
      <label
        style={{
          display: "inline-block",
          padding: "10px 18px",
          cursor: "pointer",
          backgroundColor: "#651e77",
          color: "white",
          borderRadius: "5px",
          fontSize: "14px",
          transition: "background 0.3s ease",
          marginRight: "10px",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#2980b9")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#651e77")}
      >
        Choose File
        <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
      </label>

      <button onClick={handleUpload}>Analyze</button>
      <button onClick={handleGenderDetect} disabled={!selectedFile}>
        Detect Gender
      </button>
      <button onClick={() => setShowCamera(true)}>Live Camera Detection</button>
      {result && <button onClick={handleDownloadPDF}>Download PDF</button>}
      <button onClick={() => window.location.reload()}>Refresh</button>
      <button onClick={() => setShowHistory(true)}>View History</button>

      {/* --- App Description Section --- */}
<div
  style={{
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f7f7f9",
    borderRadius: "8px",
    border: "1px solid #ddd",
    textAlign: "left",
  }}
>
  <h3 style={{ color: "#651e77", marginBottom: "10px" }}>
    About AI Image Analyzer
  </h3>
  <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.6", textAlign: "justify" }}>
    <p>
      <strong>AI Image Analyzer</strong> is a smart web application that helps you
      unlock the hidden details inside any image. Upload or capture a photo, and
      within seconds the system detects objects, generates descriptive captions,
      and even performs gender analysis using advanced AI models.
    </p>

    <p>
      More than just detection, the tool offers annotated previews, professional
      PDF reports, and a complete history of your analyses — making it valuable
      for learners, developers, and professionals alike.
    </p>

    <p>
      Powered by a modern stack — <strong>React</strong> for a sleek interface,
      <strong> Flask</strong> for AI services, and <strong>Spring Boot + MySQL</strong> 
      for secure backend storage — the AI Image Analyzer delivers speed, accuracy,
      and reliability in one seamless platform.
    </p>
  </div>
</div>

{preview && (
      <div
  className="preview-wrapper"
  style={{ position: "relative", textAlign: "center", marginTop: "20px" }}
>
  <img
    src={preview}
    alt="preview"
    style={{
      maxWidth: "400px",   // reduce size
      height: "auto",
      borderRadius: "6px",
      display: "block",
      margin: "0 auto"
    }}
    id="preview-img"
  />
  <canvas
    ref={canvasRef}
    style={{
      position: "absolute",
      top: 0,
      left: "50%",
      transform: "translateX(-50%)",
      pointerEvents: "none"
    }}
  />
</div>
)}

      {tooltip && (
        <div
          className="tooltip"
          style={{
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            position: "fixed",
          }}
        >
          {tooltip.text}
        </div>
      )}

      {result && (
  <div className="result-section">
    <h2>Analysis Result</h2>

    {result.gender && (
      <>
        <h3>Gender</h3>
        <div className="card gender-card">
          <p>
            <b>Gender:</b> {result.gender} ({(result.genderConfidence).toFixed(1)}%)
          </p>
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
          .filter(o => o.conf > 0.3)
          .map((o, i) => (
            <li key={i}>
              {o.label} - {(o.conf * 100).toFixed(1)}%
            </li>
          ))}
      </ul>
    </div>

    <h3>Total Objects Detected</h3>
    <div className="card count-card">
      <p>
        <b>Total Count:</b>{" "}
        {(result.objects || []).filter(o => o.conf > 0.3).length}
      </p>
    </div>
  </div>
)}
    </div>
  );
}

export default UploadImage;
