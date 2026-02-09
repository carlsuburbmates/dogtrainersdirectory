import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { SearchClient } from "./search-client"

export const metadata: Metadata = {
  title: "Search Dog Trainers | Melbourne Dog Trainers Directory",
  description:
    "Search verified dog trainers and behaviour consultants across Melbourne. Filter by suburb, behaviour issue, dog age, and service type.",
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <SearchClient />
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}
