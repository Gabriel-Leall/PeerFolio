"use client";

import { Card, CardHeader } from "@heroui/react";

export function FeatureGrid() {
  return (
    <section className="py-24 px-6 md:px-12 bg-[#0A0A0A]">
      <div className="max-w-280 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-[#101010] border border-white/5 hover:border-white/10 transition-colors p-8 rounded-2xl shadow-none">
          <CardHeader className="flex flex-col items-start gap-5 px-0 pt-0 pb-4">
            <span className="material-symbols-outlined text-[2rem] text-[#B89CF8]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="font-headline text-[2rem] tracking-tight text-[#EAEAEA]">Salas de Crítica</h3>
          </CardHeader>
          <div className="p-0 grow content-end flex">
            <div className="mt-auto">
              <p className="text-[#A1A1AA] text-[15px] font-body max-w-sm leading-relaxed">
                Espaços privados e criptografados para feedback criativo de alto nível de líderes do setor e colegas.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="col-span-1 bg-[#232328] border border-white/5 hover:border-white/10 p-8 rounded-2xl shadow-none flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none"></div>
          <CardHeader className="flex flex-col items-start px-0 pt-0 pb-4 mt-2">
            <h3 className="font-headline text-[1.5rem] tracking-tight text-[#EAEAEA]">Direitos de Exposição</h3>
          </CardHeader>
          <div className="p-0 mt-auto">
            <p className="text-[#888890] text-[14px] font-body leading-relaxed">
              Controle total sobre a visibilidade, distribuição e qualidade de arquivamento do seu trabalho.
            </p>
          </div>
        </Card>
        
        <Card className="col-span-1 bg-[#151515] border border-white/5 hover:border-white/10 p-8 rounded-2xl shadow-none flex flex-col relative group">
          <CardHeader className="flex flex-col items-start px-0 pt-0 pb-4 mt-2">
            <h3 className="font-headline text-[1.5rem] tracking-tight text-[#EAEAEA] group-hover:text-[#B89CF8] transition-colors">API do Cofre</h3>
          </CardHeader>
          <div className="p-0 mt-auto">
            <p className="text-[#888890] text-[14px] font-body leading-relaxed max-w-[90%]">
              Conecte seus ativos diretamente a fluxos profissionais com integridade sem perdas.
            </p>
          </div>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-[#1C1C21] border border-white/5 hover:border-white/10 p-8 rounded-2xl shadow-none flex flex-col relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#B89CF8]/5 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>
          <CardHeader className="flex flex-col items-start px-0 pt-0 pb-4 mt-2 relative z-10">
            <h3 className="font-headline text-[2rem] tracking-tight text-[#EAEAEA]">Curadoria Sob Medida</h3>
          </CardHeader>
          <div className="p-0 mt-auto relative z-10">
            <p className="text-[#888890] text-[15px] font-body max-w-md leading-relaxed">
              Nossos algoritmos não seguem tendências; eles analisam intenção, estrutura e ressonância emocional.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
