import React from "react";
import "./Skeleton.css";

/**
 * Skeleton Primitive Component
 * Renders an animated shimmer placeholder element.
 *
 * Props:
 * - variant: "text" | "circular" | "rectangular" | "badge" | "button" | "input"
 * - width: string | number (e.g. "100%", 120, "60px")
 * - height: string | number (e.g. 18, "40px")
 * - borderRadius: string | number
 * - count: number (renders multiple stacked text lines)
 * - theme: "light" | "dark"
 * - animation: "wave" | "pulse" | false
 * - className: string
 * - style: object
 */
export const Skeleton = ({
  variant = "text",
  width,
  height,
  borderRadius,
  count = 1,
  theme = "light",
  animation = "wave",
  className = "",
  style = {},
  ...props
}) => {
  const formatDimension = (val) => {
    if (val === undefined || val === null) return undefined;
    return typeof val === "number" ? `${val}px` : val;
  };

  const animClass =
    animation === "pulse" ? "anim-pulse" : animation === "wave" ? "anim-wave" : "";

  const themeClass = theme === "dark" ? "theme-dark" : "";

  const customStyle = {
    ...style,
    ...(width ? { width: formatDimension(width) } : {}),
    ...(height ? { height: formatDimension(height) } : {}),
    ...(borderRadius ? { borderRadius: formatDimension(borderRadius) } : {}),
  };

  if (count > 1) {
    return (
      <div className="skeleton-group" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={`skeleton-base skeleton-${variant} ${animClass} ${themeClass} ${className}`}
            style={{
              ...customStyle,
              // Vary width on last line for natural paragraph look
              ...(variant === "text" && i === count - 1 && !width ? { width: "70%" } : {}),
            }}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={`skeleton-base skeleton-${variant} ${animClass} ${themeClass} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};

/**
 * SkeletonTable
 * Renders a shimmering table placeholder with header and rows.
 */
export const SkeletonTable = ({
  rows = 5,
  columns = 6,
  theme = "light",
  className = "",
  columnWidths = [],
}) => {
  return (
    <div className={`skeleton-table-container ${theme === "dark" ? "theme-dark" : ""} ${className}`}>
      <table className="skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, c) => (
              <th key={c} style={{ width: columnWidths[c] || "auto" }}>
                <Skeleton
                  variant="text"
                  width={c === 0 ? "40px" : `${60 + ((c * 17) % 40)}%`}
                  height={15}
                  theme={theme}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  {c === 0 ? (
                    <Skeleton variant="text" width={26} height={14} theme={theme} />
                  ) : c === 1 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Skeleton variant="circular" width={28} height={28} theme={theme} />
                      <Skeleton variant="text" width="65%" height={14} theme={theme} />
                    </div>
                  ) : (
                    <Skeleton
                      variant="text"
                      width={`${50 + (((r + c) * 23) % 45)}%`}
                      height={14}
                      theme={theme}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * SkeletonCard
 * Renders a grid of cards with avatar/icon, title, details, and action footer.
 */
export const SkeletonCard = ({ count = 3, lines = 3, theme = "light", className = "" }) => {
  return (
    <div className={`skeleton-cards-grid ${theme === "dark" ? "theme-dark" : ""} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-header">
            <Skeleton variant="circular" width={48} height={48} theme={theme} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <Skeleton variant="text" width="75%" height={16} theme={theme} />
              <Skeleton variant="badge" width="45%" height={18} theme={theme} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "4px 0" }}>
            <Skeleton count={lines} variant="text" height={13} theme={theme} />
          </div>

          <div className="skeleton-card-footer">
            <Skeleton variant="text" width="30%" height={12} theme={theme} />
            <div style={{ display: "flex", gap: "8px" }}>
              <Skeleton variant="button" width={72} height={32} theme={theme} />
              <Skeleton variant="button" width={72} height={32} theme={theme} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonStats
 * Renders a grid of KPI metric cards with shimmer values and icons.
 */
export const SkeletonStats = ({ count = 4, theme = "light", className = "" }) => {
  return (
    <div className={`skeleton-stats-grid ${theme === "dark" ? "theme-dark" : ""} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <Skeleton variant="text" width="60%" height={13} theme={theme} />
            <Skeleton variant="text" width="40%" height={26} theme={theme} />
          </div>
          <Skeleton variant="circular" width={46} height={46} theme={theme} />
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonList
 * Renders list items with circular icon and 2 stacked text lines.
 */
export const SkeletonList = ({ count = 3, theme = "light", className = "" }) => {
  return (
    <div className={`skeleton-list ${theme === "dark" ? "theme-dark" : ""} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton variant="circular" width={38} height={38} theme={theme} />
          <div className="skeleton-list-item-content">
            <Skeleton variant="text" width={`${65 + (i % 2) * 15}%`} height={15} theme={theme} />
            <Skeleton variant="text" width="40%" height={12} theme={theme} />
          </div>
          <Skeleton variant="badge" width={60} height={20} theme={theme} />
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonForm
 * Renders form fields with labels and inputs.
 */
export const SkeletonForm = ({ fields = 4, theme = "light", className = "" }) => {
  return (
    <div className={`skeleton-form-grid ${theme === "dark" ? "theme-dark" : ""} ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="skeleton-form-field">
          <Skeleton variant="text" width="35%" height={14} theme={theme} />
          <Skeleton variant="input" height={42} theme={theme} />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
