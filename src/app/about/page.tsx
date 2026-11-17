import type { Metadata } from "next"
import { AboutExperience } from "./about-experience"

export const metadata: Metadata = { title: "소개" }

export default function AboutPage() {
  return <AboutExperience />
}
