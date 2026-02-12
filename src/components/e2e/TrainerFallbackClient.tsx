/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState } from 'react'

interface TrainerFallbackClientProps {
  id: number
}

export default function TrainerFallbackClient({ id }: TrainerFallbackClientProps) {
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fixtureKey = `e2e_trainer_${id}`
    const fixture = typeof window !== 'undefined' ? sessionStorage.getItem(fixtureKey) : null
    
    if (fixture) {
      try {
        setTrainer(JSON.parse(fixture))
      } catch (e) {
        console.error('Failed to parse trainer fixture:', e)
      }
    }
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </div>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Trainer Not Found</h1>
        <p className="text-gray-600">
          The trainer profile you&apos;re looking for could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{trainer.business_name || 'Trainer Profile'}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {trainer.description && <p className="text-gray-700 mb-4">{trainer.description}</p>}
        {trainer.suburb && <p className="text-gray-600">Location: {trainer.suburb}</p>}
      </div>
    </div>
  )
}
