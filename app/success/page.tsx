"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseType, setPurchaseType] = useState<string>("premium");

  useEffect(() => {
    if (sessionId) {
      // Verify the session and activate premium
      fetch("/api/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPurchaseType(data.type || "premium");
            
            if (data.type === "magical_voice") {
              // Handle magical voice purchase
              // Generate the TTS audio for the story
              if (data.storyId && data.storyContent) {
                fetch("/api/tts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text: data.storyContent,
                    provider: "elevenlabs",
                    voice: "shimmer",
                    rate: 0.9,
                    pitch: 1.0,
                    volume: 1.0
                  })
                })
                .then((ttsRes) => ttsRes.blob())
                .then((blob) => {
                  const url = URL.createObjectURL(blob);
                  // Store the audio URL in localStorage for the main page to pick up
                  localStorage.setItem("purchasedAudioUrl", url);
                  localStorage.setItem("purchasedStoryTitle", data.storyTitle || "Saga");
                })
                .catch((err) => {
                  console.error("TTS generation failed:", err);
                });
              }
            } else {
              // Set premium cookie for subscription purchases
              document.cookie = "premium=1; path=/; max-age=2592000"; // 30 days
              document.cookie = `premium_tier=${data.tier}; path=/; max-age=2592000`;
              document.cookie = `billing_period=${data.period}; path=/; max-age=2592000`;
            }
            
            // Redirect to main page after a short delay
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
          } else {
            setError(data.error || "Något gick fel");
          }
        })
        .catch((err) => {
          setError("Kunde inte verifiera betalning");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError("Ingen session hittades");
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
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
          width: "40px", 
          height: "40px", 
          border: "4px solid rgba(255,255,255,0.3)", 
          borderTop: "4px solid var(--accent)", 
          borderRadius: "50%", 
          animation: "spin 1s linear infinite",
          marginBottom: "20px"
        }} />
        <h1 style={{ marginBottom: "16px" }}>Verifierar din betalning...</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Vänligen vänta medan vi aktiverar din Premium-prenumeration.
        </p>
      </div>
    );
  }

  if (error) {
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
        }}>❌</div>
        <h1 style={{ marginBottom: "16px", color: "#ff6b6b" }}>Betalning misslyckades</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          {error}
        </p>
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
      </div>
    );
  }

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
      }}>🎉</div>
      <h1 style={{ marginBottom: "16px" }}>
        {purchaseType === "magical_voice" ? "Magisk röst köpt!" : "Välkommen till Premium!"}
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
        {purchaseType === "magical_voice" 
          ? "Din betalning har gått igenom och din magiska röst genereras nu. Du omdirigeras automatiskt till Drömlyktan..."
          : "Din betalning har gått igenom och din Premium-prenumeration är nu aktiv. Du omdirigeras automatiskt till Drömlyktan..."
        }
      </p>
      <div style={{ 
        width: "40px", 
        height: "40px", 
        border: "4px solid rgba(255,255,255,0.3)", 
        borderTop: "4px solid var(--accent)", 
        borderRadius: "50%", 
        animation: "spin 1s linear infinite"
      }} />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
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
          width: "40px", 
          height: "40px", 
          border: "4px solid rgba(255,255,255,0.3)", 
          borderTop: "4px solid var(--accent)", 
          borderRadius: "50%", 
          animation: "spin 1s linear infinite",
          marginBottom: "20px"
        }} />
        <h1>Laddar...</h1>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
