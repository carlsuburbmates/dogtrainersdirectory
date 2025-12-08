// Test data provider for emergency triage system
// Provides sample messages for testing all categories

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const examples = {
    medical: [
      "My dog is bleeding after being hit by a car, he's unresponsive",
      "My puppy is choking, he can't breathe, he stopped moving",
      "My dog is vomiting blood and has pale gums, what do I do?",
      "My dog ate chocolate, I think it might be toxic",
      "My dog is having a seizure, shaking uncontrollably on the floor",
      "My dog has been unconscious for 5 minutes and isn't responding"
    ],
    stray: [
      "I found a dog without a collar in my backyard, he looks lost",
      "There's a stray dog on my street, looks hungry and scared",
      "I captured a dog that's been wandering for hours",
      "My dog ran away from home, I can't find her",
      "Found a puppy in the park, no owner in sight"
    ],
    crisis_training: [
      "My normally friendly dog suddenly started attacking my other pets",
      "My dog lunged at a stranger and bit them, needs immediate help",
      "My dog is shaking uncontrollably and hiding in the corner",
      "My dog is severely anxious and trying to escape, I can't control him",
      "My rescue dog has extreme resource guarding and tried to bite me when I tried to take his food",
      "My dog is in a panic state and won't let me near him"
    ],
    other: [
      "How can I teach my dog to stop barking?",
      "My dog keeps jumping up on people when I walk him on leash",
      "I need help finding a good trainer in my area",
      "What should I do about my dog's separation anxiety when I leave?",
      "My dog needs a bath but he hates water"
    ]
  }
  
  return NextResponse.json({
    messages: [
      ...examples.medical,
      ...examples.stray,
      ...examples.crisis_training,
      ...examples.other
    ],
    total: examples.medical.length + examples.stray.length + examples.crisis_training.length + examples.other.length,
    categories: Object.entries(examples)
  })
}