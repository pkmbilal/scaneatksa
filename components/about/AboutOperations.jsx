import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { items } from "@/lib/siteData";

export default function AboutOperations() {
  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto grid max-w-7xl gap-0 px-6 py-10 md:py-20 md:px-8 lg:grid-cols-2 lg:py-0">
        <div className="flex flex-col justify-center py-0 md:py-6 lg:py-20 lg:pr-16">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Designed for operations
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Practical enough for daily service, polished enough for modern brands
          </h2>

          <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">
            ScanEat is not just about replacing printed menus. It is about
            helping restaurants create a smoother handoff between browsing,
            ordering, and service while keeping management simple on the
            operator side.
          </p>

          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <ChevronRight className="mt-1 h-4 w-4 text-primary" />
                <p className="text-sm leading-7 text-muted-foreground md:text-base">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] border mt-6 lg:my-16">
          <Image
            src="/about-ops.webp"
            alt="Restaurant operations supported by a digital ordering workflow"
            width={1400}
            height={1200}
            className="h-[360px] w-full object-cover md:h-[520px] lg:h-full"
          />
        </div>
      </div>
    </section>
  );
}