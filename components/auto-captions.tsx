"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"

interface AutoCaptionsProps {
  text: string
  isVisible: boolean
}

export function AutoCaptions({ text, isVisible }: AutoCaptionsProps) {
  // Use simple state to store the current caption text
  const [displayText, setDisplayText] = useState(text)
  const prevTextRef = useRef(text)
  
  // Update display text when the text prop changes
  useEffect(() => {
    // To handle transitions better, only update if text has actually changed
    if (text !== prevTextRef.current) {
      console.log(`Caption changing from "${prevTextRef.current}" to "${text}"`);
      prevTextRef.current = text;
      
      // Clear text immediately if new text is empty
      if (!text) {
        setDisplayText("");
        return;
      }
      
      // For non-empty text changes, apply a small transition delay
      const timer = setTimeout(() => {
        setDisplayText(text);
      }, 50);  // Reduced delay for more responsive captions
      
      return () => clearTimeout(timer);
    }
  }, [text]);

  return (
    <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none z-10">
      <AnimatePresence mode="wait">
        {isVisible && displayText && (
          <motion.div
            key={displayText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-black bg-opacity-80 px-6 py-4 rounded-lg shadow-xl max-w-[90%]"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderBottom: "3px solid rgba(255,255,255,0.2)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}
          >
            <p className="text-white text-center text-lg font-medium leading-relaxed tracking-wide">
              {displayText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}