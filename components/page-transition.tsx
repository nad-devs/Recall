"use client";

import React, { useEffect, useState } from "react";

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger the animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-spring ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  );
} 