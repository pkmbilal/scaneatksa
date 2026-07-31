import { principles } from "@/lib/siteData";

export default function AboutPrinciples() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 lg:py-28">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Principles
        </p>
        <h2 className="hidden lg:block mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          What defines the way we build
        </h2>
        <h2 className="mt-3 lg:hidden text-3xl font-semibold tracking-tight md:text-4xl">
          What defines <span className="block">the way we build</span>
          
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {principles.map((item) => (
          <div
            key={item.title}
            className="group rounded-[1.75rem] border border-border/60 bg-background p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-lg"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-primary/70 transition-all duration-300 group-hover:scale-125 group-hover:bg-primary" />
              <div className="h-px flex-1 bg-border transition-colors duration-300 group-hover:bg-primary/20" />
            </div>

            <h3 className="text-xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary">
              {item.title}
            </h3>

            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
