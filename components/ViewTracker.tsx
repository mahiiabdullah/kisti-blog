"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component lifecycle
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Send the tracking request in the background
    fetch("/api/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId }),
    }).catch((err) => {
      console.error("Failed to track view", err);
    });
  }, [postId]);

  // This component doesn't render anything
  return null;
}
