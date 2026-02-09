import { streamText, tool, convertToModelMessages } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: `You are a friendly, knowledgeable assistant for Melbourne's Dog Trainers Directory. 
You help dog owners find the perfect trainer for their needs. 
You have access to tools that search the database of verified trainers.
Always be warm, empathetic, and professional. When recommending trainers, highlight their specialties and why they might be a good fit.
If users describe behaviour issues, acknowledge their concern and suggest relevant trainers.
Keep responses concise and mobile-friendly.
You can only help with dog training related queries in Melbourne, Australia.
If you don't find results, suggest broadening the search or trying different terms.`,
    messages: await convertToModelMessages(messages),
    tools: {
      searchTrainers: tool({
        description:
          "Search for dog trainers in the Melbourne directory by name, suburb, service type, or behaviour issue. Use this when users ask about finding trainers or need recommendations.",
        inputSchema: z.object({
          query: z
            .string()
            .nullable()
            .describe("Free text search for trainer name, suburb, or keywords"),
          service: z
            .string()
            .nullable()
            .describe(
              "Service type filter: puppy_training, obedience_training, behaviour_consultations, group_classes, private_training"
            ),
          issue: z
            .string()
            .nullable()
            .describe(
              "Behaviour issue filter: pulling_on_lead, separation_anxiety, excessive_barking, dog_aggression, leash_reactivity, jumping_up, destructive_behaviour, recall_issues, anxiety_general, resource_guarding, mouthing_nipping_biting, rescue_dog_support, socialisation"
            ),
        }),
        execute: async ({ query, service, issue }) => {
          const q = query || ""
          const svc = service || ""
          const iss = issue || ""

          const rows = await sql`
            SELECT
              b.name,
              b.slug,
              b.short_bio,
              s.name as suburb_name,
              s.postcode,
              b.average_rating,
              b.review_count,
              b.pricing,
              b.phone,
              b.is_mobile,
              b.years_experience,
              ARRAY(SELECT ts.service_type FROM trainer_services ts WHERE ts.business_id = b.id) as services,
              ARRAY(SELECT tbi.behavior_issue FROM trainer_behavior_issues tbi WHERE tbi.business_id = b.id) as behavior_issues
            FROM businesses b
            LEFT JOIN suburbs s ON b.suburb_id = s.id
            WHERE b.is_active = true
              AND (${q} = '' OR (
                b.name ILIKE '%' || ${q} || '%'
                OR b.short_bio ILIKE '%' || ${q} || '%'
                OR s.name ILIKE '%' || ${q} || '%'
              ))
              AND (${svc} = '' OR EXISTS (
                SELECT 1 FROM trainer_services ts
                WHERE ts.business_id = b.id AND ts.service_type::text = ${svc}
              ))
              AND (${iss} = '' OR EXISTS (
                SELECT 1 FROM trainer_behavior_issues tbi
                WHERE tbi.business_id = b.id AND tbi.behavior_issue::text = ${iss}
              ))
            ORDER BY b.is_featured DESC, b.average_rating DESC
            LIMIT 5
          `
          return {
            trainers: rows,
            count: rows.length,
            tip: rows.length === 0
              ? "No trainers found matching that criteria. Try broadening the search."
              : `Found ${rows.length} trainer(s). Present these recommendations naturally.`,
          }
        },
      }),
      getEmergencyInfo: tool({
        description:
          "Get emergency vet and urgent care information. Use when users mention emergencies, injuries, poisoning, or urgent health concerns about their dog.",
        inputSchema: z.object({
          type: z
            .string()
            .nullable()
            .describe("emergency_vet, urgent_care, or emergency_shelter"),
        }),
        execute: async ({ type }) => {
          const resources = await sql`
            SELECT name, phone, address, is_24_hour, emergency_hours, resource_type
            FROM emergency_resources
            WHERE is_active = true
              AND (${type || ""} = '' OR resource_type::text = ${type || ""})
            ORDER BY is_24_hour DESC, name
            LIMIT 5
          `
          return {
            resources,
            urgent_note:
              "If this is a life-threatening emergency, call the nearest emergency vet immediately.",
          }
        },
      }),
    },
    maxSteps: 3,
  })

  return result.toUIMessageStreamResponse()
}
