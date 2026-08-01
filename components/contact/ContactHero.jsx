import Link from "next/link"
import Image from "next/image"
import { BadgeCheck, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactHero({ whatsappLink, email }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(0,201,81,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(0,201,81,0.08),transparent_24%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              Contact ScanEat
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Contact our team for QR menu setup and support
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              Talk to us about digital QR menus, WhatsApp ordering, onboarding,
              and restaurant launch support across Saudi Arabia.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-full px-6 text-sm shadow-sm"
              >
                <Link href={whatsappLink} target="_blank">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 rounded-full px-6 text-sm"
              >
                <Link href={`mailto:${email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email us
                </Link>
              </Button>
            </div>
          </div>

          {/* Right image placeholder */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
              <div className="aspect-[4/3] w-full bg-muted/40">
                <Image
                  src="/contact-hero.webp"
                  alt="ScanEat contact support"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-md backdrop-blur md:block">
              <p className="text-xs text-muted-foreground">Fast response</p>
              <p className="text-sm font-semibold">WhatsApp-first support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}