import React, { useState, useEffect } from "react";
import "./UploadImage.css";

function History({ onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8090/api/history");
      if (!response.ok) throw new Error("Server error: " + response.status);
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Failed to load history: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8090/api/history/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Server error: " + response.status);
      // remove from local state without a full refetch
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const parseObjects = (objectsJson) => {
    try {
      return JSON.parse(objectsJson || "[]");
    } catch {
      return [];
    }
  };

  return (
    <div className="upload-container">
      <h2>Analysis History</h2>

      <div style={{ marginBottom: "12px" }}>
        <button onClick={fetchHistory}>Refresh</button>
        <button onClick={onClose} style={{ marginLeft: "10px" }}>
          Close
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && history.length === 0 && (
        <p>No analysis history available.</p>
      )}

      {!loading && history.length > 0 && (
        <div className="result-section">
          {history.map((item) => {
            const objects = parseObjects(item.objectsJson);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="card"
                style={{ marginBottom: "12px", cursor: "pointer" }}
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ margin: 0 }}>
                      <b>{formatDate(item.createdAt)}</b>
                    </p>
                    <p style={{ margin: "4px 0 0 0", color: "#555" }}>
                      {item.description
                        ? item.description.length > 60
                          ? item.description.slice(0, 60) + "..."
                          : item.description
                        : "(no description)"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    style={{ backgroundColor: "#b23b3b" }}
                  >
                    Delete
                  </button>
                </div>

                {isExpanded && (
                
                  <div style={{ marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "10px"}}>
                    <p>
                      <b>Description:</b> {item.description || "-"}
                    </p>
                    {item.gender && (
                      <p>
                        <b>Gender:</b> {item.gender}{" "}
                        {item.genderConfidence != null &&
                          `(${item.genderConfidence.toFixed(1)}%)`}
                      </p>
                    )}
                    <p>
                      <b>Total Objects:</b> {item.objectCount}
                    </p>
                    {objects.length > 0 && (
                      <ul>
                        {objects.map((o, i) => (
                          <li key={i}>
                            {o.label} - {(o.conf * 100).toFixed(1)}%
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default History;