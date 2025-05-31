"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import LoadingBar from "@/components/loading-bar"  // make sure the path is correct

export default function VerifyPage() {
  const [text, setText] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setText(value)
    setCharCount(value.length)
  }
const handleVerify = async () => {
  if (!text.trim()) return
  setLoading(true)

  try {
    const res = await fetch("http://127.0.0.1:5000/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    })

    if (!res.ok) throw new Error("Failed to verify")

    const { label, confidence, keywords } = await res.json()
    const pct = (Number(confidence) * 100).toFixed(1)

setTimeout(() => {
  const encoded = encodeURIComponent(JSON.stringify(keywords))
  router.push(`/result/${label.toLowerCase()}?p=${pct}&k=${encoded}`)
}, 2000)


  } catch (err) {
    console.error("Verification failed:", err)
    alert("Something went wrong while verifying.")
    setLoading(false)
  }
}


  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        {loading ? (
          <LoadingBar />
        ) : (
          <>
            <h2 className="text-xl font-heading mb-6">
              Enter your text here to verify…
            </h2>

            <Textarea
              value={text}
              onChange={handleTextChange}
              className="min-h-[150px] mb-2 border-2 border-gray-300 focus:border-primary focus:ring-primary font-subtext"
              maxLength={650}
              placeholder="Enter your text here to verify..."
            />

            <div className="flex justify-end items-center mb-6">
              <span className="text-sm text-gray-500 font-subtext">
                {charCount}/650
              </span>
            </div>

            <Button
              onClick={handleVerify}
              disabled={text.trim().length === 0 || loading}
              className="bg-[#3BB4E5] hover:bg-[#2A9FD0] text-white px-8 py-2 rounded-md font-heading"
            >
              Verify
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
