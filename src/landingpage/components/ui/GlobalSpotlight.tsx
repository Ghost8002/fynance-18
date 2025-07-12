
"use client";
import React, { useState, useRef, useEffect } from "react";

interface GlobalSpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export const GlobalSpotlight = ({ children, className = "" }: GlobalSpotlightProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
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

  useEffect(() => {
    const element = divRef.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={divRef}
      className={`relative min-h-screen ${className}`}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: isActive ? 0.03 : 0,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(36, 113, 156, 0.15), transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
