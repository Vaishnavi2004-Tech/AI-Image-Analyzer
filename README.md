---
```markdown
# AI Image Analyzer

![GitHub repo size](https://img.shields.io/github/repo-size/Vaishnavi2004-Tech/AI-Image-Analyzer)
![GitHub stars](https://img.shields.io/github/stars/Vaishnavi2004-Tech/AI-Image-Analyzer?style=social)
![GitHub forks](https://img.shields.io/github/forks/Vaishnavi2004-Tech/AI-Image-Analyzer?style=social)
![GitHub issues](https://img.shields.io/github/issues/Vaishnavi2004-Tech/AI-Image-Analyzer)
![GitHub license](https://img.shields.io/github/license/Vaishnavi2004-Tech/AI-Image-Analyzer)

A full‑stack project combining **React frontend**, **Flask AI microservice**, and **Spring Boot backend** for image analysis using YOLOv8 + BLIP captioning.

---

## 🚀 Features
- **React Frontend**: Upload images, view analysis results, export PDF reports.
- **Flask AI Service**: YOLOv8 object detection + BLIP image captioning.
- **Spring Boot Backend**: REST APIs and database integration.
- **PDF Export**: jsPDF integration for frontend reports.

---

## 📂 Project Structure
```
AI-Image-Analyzer/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── LiveCamera.js
│   │   ├── UploadImage.js
│   │   ├── index.js
│   │   └── History.js
│   └── package.json
│
├── ai-image-analyzer/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/imageanalyzer/ai_image_analyzer/
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
├── ai_service.py
├── requirements.txt
│
├── yolov8n.pt
├── yolov8m.pt
│
└── README.md
```

---

## ⚙️ Setup Instructions

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

### Flask AI Service
```bash
pip install -r requirements.txt
python ai_service.py
```

### Backend (Spring Boot)
```bash
cd ai-image-analyzer
mvn spring-boot:run
```

---

## 📖 Usage
1. Run backend + Flask service.  
2. Start frontend → upload image.  
3. View detected objects + captions.  
4. Export analysis as PDF.

---

## 🛠️ Tech Stack
- **React** (UI)
- **Flask + Python** (AI service)
- **Spring Boot + Java** (Backend)
- **YOLOv8 + BLIP** (AI models)
- **MySQL** (Database)

---

## 📸 Screenshots
**Home Page**
<img width="1365" height="722" alt="Screenshot 2026-09-01 142255" src="https://github.com/user-attachments/assets/935ca52a-35c6-4d42-a68d-eb2d47a6db03" />

**Image Upload**
<img width="1365" height="719" alt="Screenshot 2026-09-01 144807" src="https://github.com/user-attachments/assets/0cac1f09-cf46-4a87-9fc3-8f5a90bef33e" />

**Analysis Result**
<img width="1365" height="720" alt="Screenshot 2026-09-01 144816" src="https://github.com/user-attachments/assets/631baa75-b9f2-4bde-8762-890f97fa592d" />

**Analysis History**
<img width="1365" height="718" alt="image" src="https://github.com/user-attachments/assets/e9920fcc-2b1f-4eea-a1e8-a27db80d350c" />

---

## 👩‍💻 Author
Vaishnavi Subramaniyan
B.E. Computer Science & Engineering  
Aspiring Java Developer | Software Developer | QA Engineer

🔗 LinkedIn: https://www.linkedin.com/in/vaishnavi-subramaniyan/

💻 GitHub: https://github.com/Vaishnavi2004-Tech
```

---

