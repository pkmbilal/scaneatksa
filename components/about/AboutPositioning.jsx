export default function AboutPositioning() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14 md:px-8">
        <div className="grid gap-6 md:gap-10 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Positioning
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Restaurant technology should feel invisible when it works well
            </h2>
          </div>

          <div className="md:col-span-2">
            <p className="max-w-4xl text-base leading-8 text-muted-foreground md:text-lg">
              We believe the best hospitality tools are the ones that reduce
              waiting, remove unnecessary steps, and fit naturally into the
              rhythm of service. ScanEat is designed around that principle:
              less friction for guests, less complexity for operators, and a
              cleaner digital layer for the restaurant experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}