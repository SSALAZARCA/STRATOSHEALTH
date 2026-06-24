"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

interface AutoLogoutProps {
  timeoutMinutes?: number;
}

export function AutoLogout({ timeoutMinutes = 15 }: AutoLogoutProps) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    // Clear session and redirect to login
    signOut({ callbackUrl: "/login?reason=timeout" });
  };

  const resetTimeout = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(logout, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "keydown",
      "wheel",
      "DOMMouseScroll",
      "mouseWheel",
      "mousedown",
      "touchstart",
      "touchmove",
    ];

    // Initial timeout
    resetTimeout();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, { passive: true });
    });

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [timeoutMinutes]);

  return null; // Este componente no renderiza nada visible
}
