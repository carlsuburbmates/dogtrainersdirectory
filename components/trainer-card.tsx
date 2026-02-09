import Link from "next/link"
import { Star, MapPin, BadgeCheck, Zap, Clock } from "lucide-react"
import { cn, getInitials, formatServiceType } from "@/lib/utils"

export interface TrainerCardData {
  id: number
  name: string
  slug: string
  short_bio: string | null
  photo_url: string | null
  suburb_name: string | null
  postcode: string | null
  average_rating: number
  review_count: number
  is_verified: boolean
  is_featured: boolean
  is_mobile: boolean
  years_experience: number | null
  services: string[]
  distance_km?: number
}

export function TrainerCard({ trainer }: { trainer: TrainerCardData }) {
  return (
    <Link
      href={`/trainers/${trainer.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5",
        trainer.is_featured && "ring-2 ring-secondary/50"
      )}
    >
      {trainer.is_featured && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
          <Zap className="h-3 w-3" />
          Featured
        </div>
      )}

      {/* Avatar / Photo Area */}
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {trainer.photo_url ? (
            <img
              src={trainer.photo_url}
              alt={trainer.name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            getInitials(trainer.name)
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {trainer.name}
            </h3>
            {trainer.is_verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
            )}
          </div>

          {trainer.suburb_name && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {trainer.suburb_name} {trainer.postcode}
                {trainer.distance_km != null && trainer.distance_km > 0 && (
                  <span className="ml-1 text-xs">
                    ({trainer.distance_km.toFixed(1)}km)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
              <span className="text-sm font-semibold text-card-foreground">
                {trainer.average_rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({trainer.review_count} reviews)
            </span>
            {trainer.years_experience && (
              <>
                <span className="text-xs text-muted-foreground">|</span>
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {trainer.years_experience}yr exp
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {trainer.short_bio && (
        <p className="line-clamp-2 px-5 text-sm leading-relaxed text-muted-foreground">
          {trainer.short_bio}
        </p>
      )}

      {/* Services Tags */}
      <div className="flex flex-wrap gap-1.5 px-5 pb-5 pt-3">
        {trainer.services.slice(0, 3).map((service) => (
          <span
            key={service}
            className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
          >
            {formatServiceType(service)}
          </span>
        ))}
        {trainer.is_mobile && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Mobile
          </span>
        )}
      </div>
    </Link>
  )
}
