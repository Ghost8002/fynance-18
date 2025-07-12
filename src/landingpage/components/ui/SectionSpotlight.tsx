
"use client";
import React, { useState, useRef, useEffect } from "react";

interface SectionSpotlightProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export const SectionSpotlight = ({ 
  children, 
  className = "",
  intensity = 0.08
}: SectionSpotlightProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    setIsActive(false);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: isActive ? intensity : 0,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(36, 113, 156, 0.2), transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
