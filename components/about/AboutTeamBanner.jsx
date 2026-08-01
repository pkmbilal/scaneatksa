import Image from "next/image";

export default function AboutTeamBanner() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8">
      <div className="group relative overflow-hidden rounded-[2rem] border">
        <Image
          src="/about-team.webp"
          alt="Professional hospitality technology brand presentation"
          width={1800}
          height={1000}
          className="h-[320px] w-full object-cover transition duration-700 group-hover:scale-[1.02] md:h-[420px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-end p-8 md:p-12">
          <div className="max-w-2xl text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/75">
              ScanEat
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
              A hospitality-first product with a more serious digital standard
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}