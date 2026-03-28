"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { FlowButton } from "@/components/flow-button";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden bg-[#0A0A0A]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-white"
              ></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"></rect>
        </svg>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 bg-primary/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center text-center gap-8 mt-16 md:mt-24">
        <h1 className="font-headline text-[3.5rem] md:text-7xl lg:text-[5.5rem] leading-[1.05] text-[#FAFAFA] tracking-tight">
          The Digital Gallery for <br className="hidden md:block" />
          the{" "}
          <span className="italic font-light text-[#E8D9FF] pr-2">
            Creative Elite.
          </span>
        </h1>

        <p className="font-body text-base md:text-lg text-[#A1A1AA] max-w-150 leading-relaxed mx-auto">
          A peer-reviewed sanctuary where design, art, and strategy converge.
          Curated for those who define the next era of visual intelligence.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 w-full sm:w-auto">
          <Link
            href={"/sign-up" as any}
            className="w-full sm:w-auto flex justify-center"
          >
            <FlowButton text="Inscrever-se" />
          </Link>
          <Link href={"/portfolio" as any} className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full bg-[#18181A] border border-white/10 text-white font-body text-[15px] font-medium px-8 h-13 hover:bg-[#27272A] transition-colors"
            >
              Explore Archive
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
