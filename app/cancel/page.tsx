"use client";

export default function CancelPage() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{ 
        fontSize: "48px", 
        marginBottom: "20px" 
      }}>😔</div>
      <h1 style={{ marginBottom: "16px" }}>Betalning avbruten</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
        Du avbröt betalningsprocessen. Inga avgifter har dragits från ditt kort.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button 
          onClick={() => window.location.href = "/"}
          style={{
            padding: "12px 24px",
            background: "var(--accent)",
            color: "#0a0620",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Tillbaka till Drömlyktan
        </button>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: "12px 24px",
            background: "rgba(255,255,255,0.1)",
            color: "var(--text-primary)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Försök igen
        </button>
      </div>
    </div>
  );
}
