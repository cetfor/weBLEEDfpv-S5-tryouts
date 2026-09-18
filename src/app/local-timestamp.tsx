"use client";

import { useEffect, useState } from "react";

type LocalTimestampProps = {
  timestamp: string;
};

export default function LocalTimestamp({ timestamp }: LocalTimestampProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  return <>{formatted ? `Updated ${formatted}` : "Updated"}</>;
}
