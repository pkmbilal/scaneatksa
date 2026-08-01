import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ContactForm({ whatsappLink }) {
  return (
    <Card className="rounded-3xl border-border bg-card shadow-sm">
      <CardContent className="p-5 md:p-7">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Send us a message</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Tell us about your restaurant
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Share your restaurant details and what you need from ScanEat.
          </p>
        </div>

        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="Your phone number"
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="business"
              className="mb-1.5 block text-sm font-medium"
            >
              Restaurant / Business Name
            </label>
            <input
              id="business"
              name="business"
              type="text"
              placeholder="Your restaurant or business name"
              className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm font-medium"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Tell us about your restaurant, branch count, and what you need from ScanEat..."
              className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
            />
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-full px-6 text-sm"
            >
              Send Message
            </Button>

            <Button
              asChild
              type="button"
              variant="outline"
              size="lg"
              className="h-11 rounded-full px-6 text-sm"
            >
              <Link href={whatsappLink} target="_blank">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact via WhatsApp
              </Link>
            </Button>
          </div>

          <p className="text-xs leading-6 text-muted-foreground">
            This form is UI-only for now. You can connect it with Supabase,
            Resend, or Formspree.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}