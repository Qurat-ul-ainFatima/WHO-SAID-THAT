"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function FakeResult() {
  const searchParams = useSearchParams()
  const confidence = searchParams.get("p") || "0.0"
  const k = searchParams.get("k")
  const keywords = k ? JSON.parse(decodeURIComponent(k)) : {}

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <Image
              src="/fake-alert-icon.png"
              alt="Fake News Alert Icon"
              width={64}
              height={64}
              className="drop-shadow-sm"
            />
          </div>

          <h2 className="text-2xl font-heading text-red-600 mb-2">Fake News Alert!</h2>
          <p className="text-gray-700 font-subtext text-lg">
            This statement contains misleading or false information.
          </p>

          <p className="text-gray-700 font-subtext mt-4 text-lg">
            <strong>Confidence:</strong> {confidence}%
          </p>

          <h3 className="mt-4 font-heading text-md text-gray-800 mb-2">Top Contributing Keywords:</h3>
          <ul className="text-gray-700 list-disc pl-6 text-left mb-6">
            {Object.entries(keywords).map(([word, score], idx) => (
              <li key={idx}>
                <strong>{word}</strong>: {parseFloat(score as string).toFixed(4)}
              </li>
            ))}
          </ul>

          <p className="text-gray-600 mb-6 font-subtext">
            WHO Said That? can make mistakes. Consider checking important info.
          </p>

          <Link href="/verify">
            <Button className="bg-[#3BB4E5] hover:bg-[#2A9FD0] text-white font-heading">
              Check Another Statement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
