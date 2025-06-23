"use client";

import { useState } from "react";
import PitchDeckChat from "./pitch-deck-chat";

export default function PitchDeckAssistantClient() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Chat Interface */}
      <PitchDeckChat />
    </div>
  );
} 