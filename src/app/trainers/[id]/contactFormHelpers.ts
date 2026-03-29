type ContactMailtoInput = {
  trainerEmail: string
  trainerName: string
  name: string
  email: string
  phone: string
  message: string
}

export function buildContactMailtoLink({
  trainerEmail,
  trainerName,
  name,
  email,
  phone,
  message
}: ContactMailtoInput) {
  const subject = encodeURIComponent(`Inquiry about ${trainerName}`)
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
  )

  return `mailto:${trainerEmail}?subject=${subject}&body=${body}`
}

export function insertSuggestedDraft(currentMessage: string, draftMessage: string) {
  const normalizedDraft = draftMessage.trim()

  if (!normalizedDraft) {
    return currentMessage
  }

  if (!currentMessage.trim()) {
    return normalizedDraft
  }

  if (currentMessage.includes(normalizedDraft)) {
    return currentMessage
  }

  return `${currentMessage.trimEnd()}\n\n${normalizedDraft}`
}
