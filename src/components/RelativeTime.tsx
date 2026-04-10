"use client";

import { useState, useEffect } from "react";
import { relativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  dateStr: string;
}

export default function RelativeTime({ dateStr }: RelativeTimeProps) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    setText(relativeTime(dateStr));

    const timer = setInterval(() => {
      setText(relativeTime(dateStr));
    }, 60000);

    return () => clearInterval(timer);
  }, [dateStr]);

  return <span suppressHydrationWarning>{text}</span>;
}
