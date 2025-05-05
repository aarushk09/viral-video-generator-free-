"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Type, AlignJustify, PaintBucket, TextIcon, BoldIcon } from "lucide-react"

export interface CaptionSettings {
  text: string
  fontColor: string
  backgroundColor: string
  opacity: number
  fontSize: number
  position: { x: number; y: number }
  style: string
}

interface CaptionEditorProps {
  settings: CaptionSettings
  onUpdate: (settings: CaptionSettings) => void
}

export function CaptionEditor({ settings, onUpdate }: CaptionEditorProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...settings, text: e.target.value })
  }

  const handleFontColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...settings, fontColor: e.target.value })
  }

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...settings, backgroundColor: e.target.value })
  }

  const handleOpacityChange = (values: number[]) => {
    onUpdate({ ...settings, opacity: values[0] })
  }

  const handleFontSizeChange = (values: number[]) => {
    onUpdate({ ...settings, fontSize: values[0] })
  }

  const handleStyleChange = (value: string) => {
    onUpdate({ ...settings, style: value })
  }

 
}
