import { BadgeCheck, Headphones, Store } from "lucide-react"

function getIcon(icon) {
  switch (icon) {
    case "store":
      return Store
    case "headphones":
      return Headphones
    case "badge":
      return BadgeCheck
    default:
      return BadgeCheck
  }
}

export default function ContactHighlights({ items }) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = getIcon(item.icon)

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}