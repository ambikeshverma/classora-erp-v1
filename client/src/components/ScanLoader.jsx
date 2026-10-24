import React, { useState, useEffect, useRef } from "react";
import { Shield } from "lucide-react";
import "./ScanLoader.css";

/**
 * useTimedLoader
 * Custom hook providing anti-flickering / anti-jerking timing guarantees:
 * 1. delay: if loading completes in less than `delay` ms (e.g. 100ms), loader is NEVER rendered.
 * 2. minDuration: if loader becomes visible, it stays visible for AT LEAST `minDuration` ms (e.g. 300ms).
 */
export const useTimedLoader = (loading, { delay = 100, minDuration = 300 } = {}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const startTimeRef = useRef(null);
  const delayTimerRef = useRef(null);
  const minTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    if (loading) {
      // Clear any pending exit timeouts
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
      setIsExiting(false);

      if (!shouldRender) {
        // Only show loader if request exceeds `delay` ms
        delayTimerRef.current = setTimeout(() => {
          startTimeRef.current = Date.now();
          setShouldRender(true);
        }, delay);
      }
    } else {
      // Loading turned false
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }

      if (shouldRender) {
        // Calculate remaining time needed to satisfy minDuration
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : minDuration;
        const remaining = Math.max(0, minDuration - elapsed);

        minTimerRef.current = setTimeout(() => {
          setIsExiting(true);
          exitTimerRef.current = setTimeout(() => {
            setShouldRender(false);
            setIsExiting(false);
            startTimeRef.current = null;
          }, 250); // Matches CSS transition duration
        }, remaining);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [loading, delay, minDuration, shouldRender]);

  return { shouldRender, isExiting };
};

/**
 * ScanLoader
 * Seamless Floating Scanning Page Overlay Loader
 * Features:
 * - Radial Vignette Overlay: Low opacity black in center for focus; high opacity on corners & edges
 * - No square/box card: Pure floating center elements
 * - Holographic Logo Circle: Classora emblem with rotating radar sweep & vertical laser scanning beam
 * - Title & Subtitle with high-tech status indicator
 * - 100ms debounce delay & 300ms minimum display anti-jerking guarantee
 */
const ScanLoader = ({
  loading = false,
  title = "Classora ERP",
  subtitle = "Initializing secure campus session & modules...",
  readout = "Scanning Permissions & Modules...",
  variant = "school", // 'school' | 'superAdmin'
  logo = null,
  delay = 100,
  minDuration = 300,
}) => {
  const { shouldRender, isExiting } = useTimedLoader(loading, { delay, minDuration });

  if (!shouldRender) return null;

  const isSuperAdmin = variant === "superAdmin";

  return (
    <div
      className={`scanloader-overlay variant-${variant} ${isExiting ? "scanloader-exiting" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="scanloader-center-glow" />
      <div className="scanloader-grid-bg" />

      {/* Seamless Floating Center (No square box) */}
      <div className="scanloader-floating-content">
        {/* Holographic Logo Circle with Radar Scanner */}
        <div className="scanloader-circle-hub">
          <div className="scanloader-ripple-1" />
          <div className="scanloader-ripple-2" />
          <div className="scanloader-radar-sweep" />

          <div className="scanloader-logo-circle">
            {/* Moving Laser Beam across circle */}
            <div className="scanloader-circle-laser" />
            <div className="scanloader-circle-sheen" />

            {/* Emblem Content */}
            {logo ? (
              <div className="scanloader-circle-glyph">{logo}</div>
            ) : isSuperAdmin ? (
              <div className="scanloader-circle-glyph">
                <Shield size={44} color="#fbbf24" style={{ filter: "drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))" }} />
              </div>
            ) : (
              <div className="scanloader-circle-glyph">C</div>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="scanloader-title">{title}</h2>

        {/* Subtitle */}
        <p className="scanloader-subtitle">{subtitle}</p>

        {/* Futuristic Scanning Track */}
        <div className="scanloader-scanning-track">
          <div className="scanloader-scanning-beam" />
        </div>

        {/* High-Tech Status Readout */}
        <div className="scanloader-status-line">
          <span className="scanloader-live-dot" />
          <span>{readout}</span>
        </div>
      </div>
    </div>
  );
};

export default ScanLoader;
