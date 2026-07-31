export default function AboutStory() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:py-20 md:px-8 lg:py-28">
      <div className="grid items-start gap-6 md:gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Our story
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            A simpler approach to digital dining
          </h2>
        </div>

        <div className="space-y-6 text-base leading-8 text-muted-foreground md:text-lg lg:col-span-7">
          <p>
            Many restaurant tools are built like back-office software first
            and guest experiences second. That usually leads to cluttered
            interfaces, slow mobile flows, and products that feel harder than
            the problem they were supposed to solve.
          </p>

          <p>
            ScanEat was created as a more focused alternative. The goal was
            not to overload restaurants with features, but to build a product
            that improves one of the most visible parts of service: how guests
            access menus, make decisions, and place orders.
          </p>

          <p>
            The result is a platform centered on clarity, speed, and
            operational practicality — designed to support modern hospitality
            without disrupting it.
          </p>
        </div>
      </div>
    </section>
  );
}