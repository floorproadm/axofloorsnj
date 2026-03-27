// ══════════════════════════════════════════════
// AXO Master System — Structured Data
// Para editar textos: mude as strings aqui.
// Para adicionar um node: adicione ao array + uma conexão.
// ══════════════════════════════════════════════

export interface NodeDetail {
  t: string;
  s?: string;
}

export interface NodeSection {
  title: string;
  color: string;
  items: NodeDetail[];
}

export interface MasterNode {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  color: "gold" | "pine" | "steel" | "violet" | "ember" | "teal" | "axo";
  /** Position in the chart (px) */
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface NodeData {
  color: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: NodeSection[];
  axo?: { t: string; x: string };
  /** Extra loop boxes shown in panel */
  loopBox?: { label: string; tags: string[] };
}

export interface Arrow {
  from: string;
  to: string;
  dashed?: boolean;
}

export interface TabConfig {
  id: string;
  label: string;
  paneLabel: string;
  paneTitle: string;
  paneSub: string;
  chartWidth: number;
  chartHeight: number;
  nodes: MasterNode[];
  arrows: Arrow[];
}

// ══════════════════════════════════════════════
// NODE DETAIL DATA (panel content)
// ══════════════════════════════════════════════
export const NODE_DATA: Record<string, NodeData> = {
  // ── TAB 0: CADEIA DE VALOR ──
  "cv-macro": {
    color: "#c9952a",
    eyebrow: "Camada 0 — Forças Macro",
    title: "Capital · Regras · Demanda Macro",
    intro: "Não é uma etapa da cadeia — é o ambiente que condiciona todas as camadas simultaneamente. Quando taxas sobem, housing turnover cai e a demanda por refinishing enfraquece. Quando regulação aperta, o custo de compliance dos executores aumenta.",
    sections: [
      { title: "Forças econômicas", color: "#c9952a", items: [
        { t: "Taxas de juros", s: "Movem o mercado imobiliário inteiro — alta taxa reduz transações e projetos" },
        { t: "Housing turnover", s: "Volume de compra/venda de imóveis = principal driver de demanda por flooring" },
        { t: "Crédito imobiliário (FHA, VA, conventional)", s: "Facilidade de crédito determina quem compra e quando" },
        { t: "Seguro residencial", s: "Reclamos de dano frequentemente incluem flooring replacement" },
      ]},
      { title: "Regulação e compliance", color: "#c9952a", items: [
        { t: "Regulação federal (EPA RRP)", s: "Obrigatório para work em casas pré-1978 — lead paint rules" },
        { t: "HIC License (NJ, NY, CT...)", s: "Home Improvement Contractor license — exigida por estado" },
        { t: "OSHA", s: "Safety compliance para crews em campo" },
        { t: "Regulação estadual de licensing", s: "Varia por estado — NJ tem requisitos específicos" },
      ]},
      { title: "Plataformas digitais", color: "#c9952a", items: [
        { t: "Google Local Services Ads", s: "Afeta custo de aquisição de lead diretamente" },
        { t: "Angi / Thumbtack / Houzz", s: "Plataformas de lead marketplace — competição por preço" },
        { t: "Instagram / TikTok", s: "Conteúdo before/after como canal de discovery" },
      ]},
      { title: "Impacto direto sobre a cadeia", color: "#c9952a", items: [
        { t: "→ Manufatura", s: "Demanda macro determina volume de produção" },
        { t: "→ Big Box / Retail", s: "Taxas e turnover movem volume de vendas varejo" },
        { t: "→ Captura digital", s: "Plataformas definem custo e volume de leads" },
        { t: "→ Compliance local (06B)", s: "Regulação define custo operacional dos executores" },
      ]},
    ],
  },
  "cv-recurso": {
    color: "#3aaa60",
    eyebrow: "Camada 01A — Recursos Primários",
    title: "Recurso Base",
    intro: "Ponto de origem de toda a cadeia física do hardwood flooring. A qualidade da madeira e o processo de secagem determinam a estabilidade do produto final.",
    sections: [
      { title: "Espécies mais comuns no mercado US", color: "#3aaa60", items: [
        { t: "Red & White Oak", s: "Espécie dominante no mercado residencial northeast" },
        { t: "Maple & Hickory", s: "Alta dureza — popular em comercial e sports floors" },
        { t: "Cherry, Walnut, Ash", s: "Premium — maior valor por sqft" },
        { t: "Exotic (teak, acacia, bamboo)", s: "Importado — segmento crescente" },
      ]},
      { title: "Processo de matéria-prima", color: "#3aaa60", items: [
        { t: "Florestas (managed & harvested)", s: "FSC certified cada vez mais requerido por especificadores" },
        { t: "Hardwood logs → serraria", s: "Corte em boards de dimensões específicas" },
        { t: "Air drying / Kiln drying", s: "Secagem controla moisture content — crítico para estabilidade" },
        { t: "Grading (Select, #1 Common, #2 Common)", s: "Grade afeta preço e onde o produto é usado" },
      ]},
    ],
    axo: { t: "Relevância para AXO", x: "Solid unfinished hardwood (especialmente oak) é o produto que alimenta refinishing. Kiln-dried wood bem processada aceita melhor stain e finish. Conhecer grades ajuda a especificar material em projetos de instalação." },
  },
  "cv-quimica": {
    color: "#c9952a",
    eyebrow: "Camada 01B — Insumos Industriais",
    title: "Química e Insumos",
    intro: "Entra tanto na manufatura de piso quanto diretamente no campo de execução. É um dos poucos inputs que bypassa distribuidores e chega direto ao contractor.",
    sections: [
      { title: "Finishes", color: "#c9952a", items: [
        { t: "Oil-based polyurethane", s: "Durável · âmbar com o tempo · secagem lenta (24-48h)" },
        { t: "Water-based polyurethane", s: "Secagem rápida · mais claro · custo maior · VOC menor" },
        { t: "Hardwax oil (Rubio, Osmo)", s: "Natural look · fácil reparo local · crescendo em premium" },
        { t: "Aluminum oxide (factory only)", s: "Prefinished — não aplicável no campo" },
      ]},
      { title: "Stains", color: "#c9952a", items: [
        { t: "Oil-based stains", s: "Mais penetração · mais tempo de trabalho" },
        { t: "Water-based stains", s: "Secagem rápida · mais consistente" },
        { t: "Reactive stains (Rubio, RBC)", s: "Reagem com taninos da madeira — look natural premium" },
        { t: "Custom color matching", s: "Diferencial competitivo para projetos de reforma" },
      ]},
      { title: "Abrasives e outros", color: "#c9952a", items: [
        { t: "Sandpaper (24 → 80 → 100 → 120 grit)", s: "Consumível principal de refinishing — custo operacional" },
        { t: "Screen discs / rescreen pads", s: "Para screening & recoat sem sanding completo" },
        { t: "Adhesives / glue", s: "Para instalação de solid e engineered" },
        { t: "Fillers / wood putty", s: "Reparo de gaps e danos antes do finish" },
      ]},
    ],
    axo: { t: "Posição AXO neste nível", x: "AXO compra insumos diretamente de distribuidores especializados (Loba, Bona, Basic Coatings) — não de Big Box. A escolha de finish define a qualidade percebida pelo cliente e é um diferencial de posicionamento." },
  },
  "cv-manufatura": {
    color: "#c9952a",
    eyebrow: "Camada 02 — Produção Industrial",
    title: "Manufatura de Piso",
    intro: "Converte matéria-prima em produto acabado. Produz os três formatos que chegam ao mercado — e essa escolha de formato determina quais serviços são necessários no campo.",
    sections: [
      { title: "Tipos de produto", color: "#c9952a", items: [
        { t: "Solid Hardwood (3/4\" thick)", s: "Pode ser refinished múltiplas vezes — produto ideal para AXO" },
        { t: "Engineered Wood (multicamada)", s: "Core de HDF/plywood + camada de hardwood · mais estável · menos refinishable" },
        { t: "Prefinished (factory-coated)", s: "Sai da fábrica com finish · instalação rápida · difícil de repair" },
        { t: "Unfinished (site-finished)", s: "Finish aplicado no local · território direto de AXO" },
      ]},
      { title: "Tendências de produto", color: "#c9952a", items: [
        { t: "Wide plank crescendo (5\"+)", s: "Demanda mais cuidado no sanding" },
        { t: "Gray / white washed tones", s: "Trendy — mais difícil de match em repair" },
        { t: "Wire-brushed / distressed textures", s: "Finish texturizado — não pode ser resanded facilmente" },
        { t: "Low gloss / matte finish", s: "Dominante em residencial premium atualmente" },
      ]},
    ],
    axo: { t: "Impacto estratégico para AXO", x: "Prefinished com aluminum oxide reduz demanda por finishing em campo. Engineered tem wear layer fina — limita refinishings possíveis. O crescimento de solid unfinished é favorável à AXO." },
  },
  "cv-marcas": {
    color: "#4a9ad4",
    eyebrow: "Camada 03A — Marcas Nacionais",
    title: "Fabricantes / Marcas",
    intro: "Controlam especificação e preferência no canal B2B. Designers e arquitetos especificam por marca.",
    sections: [
      { title: "Players dominantes", color: "#4a9ad4", items: [
        { t: "AHF Products", s: "Maior manufacturer de solid hardwood nos EUA (Bruce, Hartco, Robbins)" },
        { t: "Mohawk Industries", s: "Maior flooring company do mundo — hardwood + carpet + tile" },
        { t: "Shaw Floors", s: "Segundo maior — forte em engineered e prefinished" },
        { t: "Mullican Flooring", s: "Mid-market solid hardwood — forte no northeast" },
        { t: "Mirage (Boa-Franc)", s: "Premium Canadian brand — popular em high-end residential" },
      ]},
      { title: "Como afetam a cadeia", color: "#4a9ad4", items: [
        { t: "→ Distribuição B2B", s: "Vendem via distribuidores regionais autorizados" },
        { t: "→ Big Box direto", s: "Mohawk e Shaw têm contratos exclusivos com HD e Lowe's" },
        { t: "Programas de preferência", s: "Pagam distribuidores para promover linha" },
      ]},
    ],
    axo: { t: "Relevância para AXO", x: "AXO não compete com fabricantes — é complementar. Quando um cliente tem Bruce ou Mirage instalado, é AXO que faz o refinishing anos depois." },
  },
  "cv-importadores": {
    color: "#4a9ad4",
    eyebrow: "Camada 03B — Sourcing Alternativo",
    title: "Importadores / Sourcing",
    intro: "Pressão de preço sobre marcas nacionais. Produto importado domina segmentos de entrada e mid-market.",
    sections: [
      { title: "Origens principais", color: "#4a9ad4", items: [
        { t: "China", s: "Domina engineered wood importado · preço baixo · qualidade variável" },
        { t: "Brasil", s: "Espécies tropicais (cumaru, ipe, tauari) · popular em exotic hardwood" },
        { t: "Europa (Alemanha, Suécia)", s: "Hardwax oil floors · Boen, Kahrs · premium segment" },
        { t: "Canadá", s: "Oak e maple de alta qualidade · Mirage, Lauzon" },
      ]},
      { title: "Dinâmica de mercado", color: "#4a9ad4", items: [
        { t: "Private label", s: "Distribuidores vendem produto importado com marca própria" },
        { t: "Tarifas e anti-dumping", s: "Criaram incerteza de preço — oportunidade para sourcing nacional" },
        { t: "Qualidade variável", s: "Produto de baixo custo gera mais demanda por repair e refinish" },
      ]},
    ],
  },
  "cv-distribb2b": {
    color: "#c9952a",
    eyebrow: "Camada 04A — Canal B2B",
    title: "Distribuição B2B",
    intro: "Intermediário entre fabricantes e contractors. É onde a AXO compra material para projetos de instalação.",
    sections: [
      { title: "Tipos de distribuidores", color: "#c9952a", items: [
        { t: "Distribuidores regionais especializados", s: "Ex: BPI (Northeast), Swiff-Train (Southeast), Derr Flooring" },
        { t: "Atacadistas gerais", s: "Carregam flooring entre outros materiais de construção" },
        { t: "Manufacturer reps", s: "Representam uma ou poucas marcas" },
        { t: "Specialty finish distributors", s: "Bona, Basic Coatings, Loba" },
      ]},
      { title: "Como servem o contractor", color: "#c9952a", items: [
        { t: "Crédito para contractors", s: "Flooring é comprado antes de receber do cliente" },
        { t: "Amostras e especificação", s: "Ajudam a fechar projetos" },
        { t: "Tech support", s: "Bona e outros oferecem treinamento técnico" },
        { t: "Volume pricing", s: "Discount tiers por volume" },
      ]},
    ],
    axo: { t: "Posição AXO neste nível", x: "AXO deve desenvolver relacionamentos com 1-2 distribuidores especializados (material) + 1 finish distributor (Bona/Basic Coatings). Concentrar volume = melhores preços e crédito." },
  },
  "cv-bigbox": {
    color: "#c9952a",
    eyebrow: "Camada 04B — Varejo",
    title: "Big Box / Especialistas",
    intro: "Canal de venda direta para homeowners. Competidor indireto no canal de instalação — mas também fonte de demanda.",
    sections: [
      { title: "Players", color: "#c9952a", items: [
        { t: "Home Depot", s: "Maior varejista de flooring dos EUA · tem próprio serviço de instalação" },
        { t: "Lowe's", s: "Similar ao HD · menor share em flooring" },
        { t: "Floor & Decor", s: "Especialista · foco em profissional (Pro desk) e DIY" },
        { t: "LL Flooring (legacy)", s: "Era Lumber Liquidators · falência 2024" },
      ]},
      { title: "Dinâmica competitiva", color: "#c9952a", items: [
        { t: "Venda direta ao consumidor final", s: "Homeowner compra em HD, contrata installer separado — oportunidade para AXO" },
        { t: "Serviço de instalação próprio", s: "HD/Lowe's têm instaladores terceirizados — competição direta" },
        { t: "Pro Desk (Floor & Decor)", s: "Canal B2B que tenta capturar contractors" },
      ]},
    ],
    axo: { t: "Posição AXO", x: "AXO não sourcea de Big Box — margem muito baixa. Mas Big Box é fonte de leads: homeowner compra produto lá, precisa de installer." },
  },
  "cv-captura": {
    color: "#3aaa60",
    eyebrow: "Camada 05A — Marketing Digital",
    title: "Captura de Demanda",
    intro: "Como a demanda existente encontra a AXO. Alta-intenção (Google Search) converte melhor mas é disputada por preço.",
    sections: [
      { title: "Canais de alta intenção", color: "#3aaa60", items: [
        { t: "Google Search", s: "\"Hardwood floor refinishing near me\" — intent máxima" },
        { t: "Google Business Profile (GBP)", s: "Reviews · fotos · Q&A · crucial para ranking local" },
        { t: "Local Services Ads (LSAs)", s: "Pay-per-lead · Google-backed badge de confiança" },
      ]},
      { title: "Canais de descoberta", color: "#3aaa60", items: [
        { t: "Instagram / Facebook", s: "Before/after content · brand awareness" },
        { t: "Nextdoor", s: "Hiperlocal — poderoso para NJ suburban market" },
        { t: "Angi / Houzz / Thumbtack", s: "Lead marketplaces — competição por preço" },
      ]},
      { title: "Owned media", color: "#3aaa60", items: [
        { t: "Website / landing page", s: "Hub de conversão · SEO local" },
        { t: "Reviews (Google, Yelp)", s: "Social proof — volume e recência afetam ranking" },
        { t: "Email / WhatsApp follow-up", s: "Nurture de leads e reativação de clientes" },
      ]},
    ],
    axo: { t: "Foco estratégico AXO", x: "Prioridade: GBP otimizado + review velocity + LSAs para NJ market. Segundo: Instagram before/after. Terceiro: Nextdoor hyperlocal." },
  },
  "cv-especificadores": {
    color: "#8a7ad4",
    eyebrow: "Camada 05B — Canal B2B de Influência",
    title: "Especificadores de Demanda",
    intro: "Atores que influenciam a decisão do cliente final. Canal de maior valor por indicação — cada parceiro ativo gera múltiplos jobs recorrentes com CAC próximo de zero.",
    sections: [
      { title: "Atores e valor estratégico", color: "#8a7ad4", items: [
        { t: "Realtors", s: "Alta urgência (pré-listing) · decisão rápida · volume sazonal" },
        { t: "Builders", s: "Volume alto por projeto · margens menores · relacionamento de longo prazo" },
        { t: "GCs (General Contractors)", s: "Subcontratam flooring como trade especializado" },
        { t: "Interior Designers", s: "Especificam produto e contractor · cliente premium" },
        { t: "Property Managers", s: "Portfolio de unidades · recorrência previsível" },
        { t: "Handymans", s: "Recebem pedidos que não executam · indicam especialistas" },
      ]},
      { title: "Como ativar este canal", color: "#8a7ad4", items: [
        { t: "Primeiro job impecável", s: "Experiência do parceiro define se vai indicar" },
        { t: "Follow-up estruturado", s: "30/90/180 dias após job — manter topo de mente" },
        { t: "Co-marketing", s: "Tag no Instagram, referência no portfolio" },
      ]},
    ],
    axo: { t: "Posição AXO — Partner Channel", x: "Especificadores bem desenvolvidos viram o Partner Channel System da AXO — Tiers Entry/Preferred/Elite. Uma vez integrado, a AXO recebe jobs recorrentes sem custo de aquisição." },
  },
  "cv-execucao": {
    color: "#c9952a",
    eyebrow: "Camada 06A · AXO Floors",
    title: "Execução Local — AXO Floors",
    intro: "Posição central da AXO na cadeia. Recebe demanda de múltiplas fontes e entrega o serviço físico. É onde a proposta de valor é provada ou quebrada.",
    sections: [
      { title: "Serviços executados", color: "#c9952a", items: [
        { t: "Sand & Refinish", s: "Core do negócio · solid hardwood" },
        { t: "Staining", s: "Custom color · color matching · diferencial premium" },
        { t: "Screening & Recoat", s: "Manutenção sem sanding completo · alta margem" },
        { t: "Installation — Solid Hardwood", s: "Nail-down · subfloor prep" },
        { t: "Installation — Engineered", s: "Glue-down · floating · staple-down" },
        { t: "Repair / Board Replacement", s: "Matching de cor e espécie · diferencial técnico" },
      ]},
      { title: "Fluxo operacional", color: "#c9952a", items: [
        { t: "Lead → Qualificação → Estimativa", s: "Residential ou Partner track" },
        { t: "Site visit + Proposal", s: "Silver · Gold · Platinum packages" },
        { t: "Execution SOP", s: "Crew · daily updates · QC checkpoints" },
        { t: "Completion + Handover", s: "Walkthrough · approval · invoice · review request" },
      ]},
    ],
    axo: { t: "Vantagem competitiva AXO", x: "Posicionamento acima do commodity contractor — comunicação, pontualidade, fotos de processo, garantia explícita e follow-up pós-job." },
  },
  "cv-compliance": {
    color: "#8a7ad4",
    eyebrow: "Camada 06B — Habilitadores",
    title: "Mão de Obra e Compliance",
    intro: "Entrada obrigatória para operar legalmente. Não é opcional — é o custo de estar no jogo. Quando bem executado, vira barreira de entrada contra concorrentes.",
    sections: [
      { title: "Requisitos de licensing", color: "#8a7ad4", items: [
        { t: "HIC License", s: "Obrigatório em NJ para qualquer projeto acima de $500" },
        { t: "EPA RRP Certification", s: "Lead-safe work practices para casas pré-1978" },
        { t: "Business registration (LLC/Corp)", s: "NJ Division of Revenue · EIN" },
      ]},
      { title: "Seguros", color: "#8a7ad4", items: [
        { t: "General Liability Insurance", s: "Mínimo $1M por ocorrência" },
        { t: "Workers Compensation", s: "Obrigatório quando tem employees" },
        { t: "Commercial Auto", s: "Veículos de trabalho precisam de cobertura comercial" },
      ]},
      { title: "Skill e crew", color: "#8a7ad4", items: [
        { t: "Sanding skill (drum, edge, orbital)", s: "Anos de prática · ler o grain da madeira" },
        { t: "Finishing technique", s: "Aplicação uniforme · temperatura e umidade afetam resultado" },
        { t: "Crew management e SOP", s: "Consistência de resultado mesmo com diferentes crews" },
      ]},
    ],
    axo: { t: "Posição AXO", x: "Compliance completo (HIC, EPA RRP, insurance) é diferencial explícito de confiança para homeowners e obrigatório para parceiros corporativos." },
  },
  "cv-cliente": {
    color: "#e07040",
    eyebrow: "Camada 07 — Demanda Final",
    title: "Cliente Final",
    intro: "O destinatário de toda a cadeia. Cada tipo tem perfil, urgência, LTV e canal de aquisição diferentes.",
    sections: [
      { title: "Segmento Residential", color: "#e07040", items: [
        { t: "Homeowner direto", s: "Decisão própria · maior margem · quer confiança e qualidade" },
        { t: "Buyer (pré-mudança)", s: "Refinish antes de ocupar · urgência alta" },
        { t: "Seller (pré-venda)", s: "Preparação para listing · realtor indica" },
        { t: "Homeowner de manutenção", s: "Screening & recoat · menor ticket · alta frequência" },
      ]},
      { title: "Segmento Commercial / B2B", color: "#e07040", items: [
        { t: "Builder account", s: "Projetos novos · volume por unidade" },
        { t: "Property Manager portfolio", s: "Múltiplas unidades · manutenção periódica" },
        { t: "Light commercial", s: "Escritórios boutique · varejo premium" },
        { t: "Flipper / investor", s: "Alto volume · preço-sensitivo · frequência alta" },
      ]},
    ],
  },
  "cv-posvenda": {
    color: "#3aaa60",
    eyebrow: "Camada 08 — Motor de Reputação",
    title: "Pós-Venda / Reputação",
    intro: "A única camada que retroalimenta diretamente a demanda. Um sistema de pós-venda bem executado transforma cada job fechado em source de novos jobs.",
    sections: [
      { title: "Componentes do motor", color: "#3aaa60", items: [
        { t: "Google Review Request", s: "Pedido no dia da conclusão · link direto · meta: 5 estrelas" },
        { t: "Before / After Photography", s: "Asset de conteúdo · Instagram · portfolio" },
        { t: "Referral Ask", s: "Pedido explícito de indicação 2-4 semanas pós-job" },
        { t: "30/90/180 day follow-up", s: "Check-in de satisfação · manutenção futura" },
        { t: "Warranty communication", s: "Carta de garantia percebida · diferencial premium" },
      ]},
      { title: "Loops de retroalimentação", color: "#3aaa60", items: [
        { t: "Reviews → Google ranking (05A)", s: "Volume e recência afetam posição no 3-pack" },
        { t: "Referrals → Word of mouth (05B)", s: "Cliente satisfeito indica para realtor, vizinho" },
        { t: "Content → Instagram (05A)", s: "Before/after vira discovery para novos clientes" },
        { t: "Repeat network → Retention", s: "Cliente de manutenção = MRR previsível" },
      ]},
    ],
    axo: { t: "Sistema AXO de pós-venda", x: "Review request automático + foto de before/after padrão em todo job + follow-up 30 dias. Cada job que gera review de 5 estrelas e indicação tem CAC = $0 para o próximo cliente." },
    loopBox: { label: "↻ retroalimenta", tags: ["Reviews → Google (05A)", "Referrals → Especificadores (05B)", "Content → Social (05A)"] },
  },

  // ── TAB 1: INFLUENCE ──
  "axo-center": {
    color: "#c9952a",
    eyebrow: "Centro do Sistema",
    title: "AXO Floors",
    intro: "Posição central no mapa de influência local. Recebe demanda tanto diretamente dos atores quanto via cliente final. A marca, confiança e execução da AXO são o que transforma indicação em job fechado.",
    sections: [
      {
        title: "Proposta de valor no mapa",
        color: "#c9952a",
        items: [
          { t: "Execução de qualidade", s: "O produto final que todos os atores indicam — qualidade é não-negociável" },
          { t: "Confiança e compliance", s: "HIC · EPA RRP · Insurance — base para parceiros corporativos" },
          { t: "Marca reconhecível", s: "Nome AXO = referência em hardwood flooring no NJ market" },
          { t: "Processo claro", s: "SOP de comunicação — parceiro sabe o que esperar" },
        ],
      },
    ],
    axo: { t: "Sistema de ativação", x: "Cada ator ao redor é um canal de indicação potencial. O objetivo é converter atores em parceiros ativos — que indicam AXO de forma sistemática, não ocasional." },
  },

  "inf-realtors": {
    color: "#3aaa60",
    eyebrow: "Influenciador · Alta Urgência",
    title: "Realtors",
    intro: "Canal de maior urgência e velocidade de decisão. Realtor precisa de refinish antes do listing — deadline do closing cria pressão que favorece contractors de confiança com agenda ágil.",
    sections: [
      {
        title: "Por que são valiosos",
        color: "#3aaa60",
        items: [
          { t: "Timing de listing cria urgência", s: "Pré-venda = prazo curto · decisão rápida · pouca comparação de preço" },
          { t: "ROI claro para o cliente", s: "Refinish eleva valor percebido do imóvel · vende mais rápido" },
          { t: "Volume sazonal previsível", s: "Pico na primavera/verão = planejamento de capacidade possível" },
          { t: "Um realtor = múltiplos clientes", s: "Cada agente ativo tem carteira de listings contínua" },
        ],
      },
      {
        title: "Como ativar este canal",
        color: "#3aaa60",
        items: [
          { t: "Primeiro job impecável + prazo cumprido", s: "Confiança construída no primeiro job" },
          { t: "Materiais de referral simples", s: "Card com QR code · link direto · fácil de compartilhar com cliente" },
          { t: "Resposta em menos de 2h", s: "Realtor valoriza velocidade — resposta lenta = perde o job" },
          { t: "Parceria com RE Company", s: "Uma parceria = acesso a múltiplos agentes" },
        ],
      },
    ],
  },

  "inf-builders": {
    color: "#3aaa60",
    eyebrow: "Influenciador · Alto Volume",
    title: "Builders",
    intro: "Projetos novos e renovações de escala. Cada builder ativo pode gerar múltiplos jobs por mês — mas exige processo profissional, compliance completo e preço consistente.",
    sections: [
      {
        title: "Perfil do canal",
        color: "#3aaa60",
        items: [
          { t: "Volume por projeto", s: "Uma construção nova pode ter 2.000–5.000 sqft de hardwood" },
          { t: "Subcontratação sistemática", s: "Builder não executa flooring — precisa de trade specialist confiável" },
          { t: "Relacionamento de longo prazo", s: "Builder satisfeito vira fonte recorrente por anos" },
          { t: "Margem menor, volume maior", s: "Negociação de preço por volume é esperada" },
        ],
      },
      {
        title: "Requisitos para entrar neste canal",
        color: "#3aaa60",
        items: [
          { t: "Compliance completo obrigatório", s: "HIC · insurance · EPA RRP — sem isso não entra na obra" },
          { t: "Processo de communication claro", s: "Updates de progresso · documentação · invoice profissional" },
          { t: "Capacidade de equipe", s: "Jobs de volume exigem crew disponível e escalável" },
        ],
      },
    ],
  },

  "inf-re": {
    color: "#3aaa60",
    eyebrow: "Influenciador · Multiplicador",
    title: "Real Estate Companies",
    intro: "Uma parceria com a empresa multiplica o alcance para todos os agentes do portfólio. É o canal com maior leverage por esforço de ativação.",
    sections: [
      {
        title: "Mecânica de leverage",
        color: "#3aaa60",
        items: [
          { t: "Uma empresa = dezenas de realtors", s: "Keller Williams NJ · RE/MAX · Coldwell Banker — cada um com carteira de listings" },
          { t: "Preferred vendor program", s: "Algumas RE companies mantêm lista de contractors aprovados — entrar nessa lista = fluxo passivo" },
          { t: "Treinamento e apresentação", s: "Oportunidade de apresentar AXO em team meeting da empresa" },
          { t: "Co-marketing digital", s: "Tag da RE company no Instagram amplifica alcance local" },
        ],
      },
    ],
  },

  "inf-pm": {
    color: "#3aaa60",
    eyebrow: "Influenciador · Recorrência",
    title: "Property Managers",
    intro: "Portfólios de unidades residenciais e comerciais. Turn de inquilinos gera demanda previsível e recorrente — ideal para planejamento de capacidade da AXO.",
    sections: [
      {
        title: "Por que é o canal mais previsível",
        color: "#3aaa60",
        items: [
          { t: "Turn de inquilino = refinish frequente", s: "Cada saída de inquilino = potencial job de refinish ou recoat" },
          { t: "Portfólio de múltiplas unidades", s: "10–200 unidades por PM = volume estável por trimestre" },
          { t: "Decisão centralizada", s: "Um contato decide para todas as unidades — eficiência comercial" },
          { t: "Pricing de volume negociável", s: "Contrato anual com pricing previsível para ambos os lados" },
        ],
      },
      {
        title: "Como abordar",
        color: "#3aaa60",
        items: [
          { t: "Proposta de contrato anual", s: "Preço fixo por tipo de serviço · SLA de resposta · prioridade de agenda" },
          { t: "Compliance como argumento", s: "PM de portfólio corporativo exige seguro e licença — ter isso é pré-requisito" },
          { t: "Primeiro job gratuito ou descontado", s: "Trial job para provar qualidade e processo" },
        ],
      },
    ],
  },

  "inf-designers": {
    color: "#8a7ad4",
    eyebrow: "Influenciador · Premium",
    title: "Interior Designers",
    intro: "Especificam produto e contractor como parte do projeto. Cliente de designer já vem com expectativa premium — ticket maior, exigência maior, mas LTV altíssimo.",
    sections: [
      {
        title: "Como funcionam",
        color: "#8a7ad4",
        items: [
          { t: "Especificação formal", s: "Designer coloca AXO no caderno de especificações — cliente chega pré-vendido" },
          { t: "Confiança no contractor é pessoal", s: "Designer recomenda com o próprio nome — só indica quem não vai embaraçar" },
          { t: "Foco em color matching e premium finishes", s: "Water-based · custom stain · Rubio Monocoat — domínio técnico é exigido" },
          { t: "Repeat em múltiplos projetos", s: "Designer ativo tem 5–20 projetos simultâneos ou sequenciais" },
        ],
      },
      {
        title: "Como atrair designers",
        color: "#8a7ad4",
        items: [
          { t: "Portfólio visual premium", s: "Instagram com before/after de qualidade · fotos profissionais · projetos diferenciados" },
          { t: "Amostras de stain customizado", s: "Kit de amostras físicas para apresentar a clientes" },
          { t: "Processo de especificação claro", s: "PDF com opções de finish · timeline · amostras disponíveis" },
        ],
      },
    ],
  },

  "inf-arq": {
    color: "#8a7ad4",
    eyebrow: "Influenciador · Projetos",
    title: "Arquitetos",
    intro: "Projetos residenciais e comerciais de maior escala. Ciclo longo mas alto ticket — quando o arquiteto especifica AXO, o job já está garantido antes do cliente pedir orçamento.",
    sections: [
      {
        title: "Perfil do canal",
        color: "#8a7ad4",
        items: [
          { t: "Especificação na planta", s: "Arquiteto define floor type e finish na etapa de projeto — antes da obra" },
          { t: "Projetos residenciais premium", s: "Renovações de alto padrão · adições · custom homes" },
          { t: "Projetos comerciais", s: "Escritórios boutique · estúdios · varejo premium · hospitality" },
          { t: "Ciclo de 6–18 meses", s: "Projeto → aprovação → obra — lead time longo mas job garantido" },
        ],
      },
    ],
  },

  "inf-gcs": {
    color: "#8a7ad4",
    eyebrow: "Influenciador · B2B Direto",
    title: "GCs (General Contractors)",
    intro: "Gerenciam obras completas e subcontratam cada trade. Para um GC ativo, ter um flooring contractor confiável é necessidade operacional — não luxo.",
    sections: [
      {
        title: "Dinâmica do canal",
        color: "#8a7ad4",
        items: [
          { t: "Subcontratação sistemática", s: "GC não executa flooring — precisa de specialist que apareça no dia certo" },
          { t: "Confiabilidade > preço", s: "GC prefere pagar mais por um contractor que não faz vacilo na obra" },
          { t: "Múltiplos projetos simultâneos", s: "GC ativo tem 3–10 obras abertas — potencial de volume real" },
          { t: "Referral orgânico entre GCs", s: "GCs se recomendam entre si — entrar em uma rede é entrar em várias" },
        ],
      },
      {
        title: "Como entrar neste canal",
        color: "#8a7ad4",
        items: [
          { t: "Primeiro job: zero falhas", s: "Prazo · qualidade · comunicação — tudo tem que ser perfeito" },
          { t: "Processo profissional de invoice", s: "GC precisa de documentação para cobrar do dono da obra" },
          { t: "Compliance na ponta da língua", s: "HIC · EPA RRP · insurance — GC vai perguntar antes de contratar" },
        ],
      },
    ],
  },

  "inf-handyman": {
    color: "#8a7ad4",
    eyebrow: "Influenciador · Indicação Quente",
    title: "Handymans",
    intro: "Recebem pedidos de flooring que não têm skill ou licença para executar. Indicam contractors especializados de confiança — indicação quente porque o handyman já qualificou o cliente.",
    sections: [
      {
        title: "Mecânica da indicação",
        color: "#8a7ad4",
        items: [
          { t: "Cliente já qualificado e pronto", s: "Handyman só indica quando cliente quer o serviço agora — não é lead frio" },
          { t: "Baixo custo de ativação", s: "Handyman ativo precisa de poucos contatos para virar fonte recorrente" },
          { t: "Reciprocidade natural", s: "AXO pode indicar handyman para clientes com outros serviços · troca de valor" },
          { t: "Rede local densa", s: "Handymans conhecem outros contractors, realtors e PMs — ponto de entrada na rede local" },
        ],
      },
    ],
  },

  // ── TAB 2: PARTNER ──
  "p-prospect": {
    color: "#c9952a",
    eyebrow: "Etapa 01 — Topo do Canal",
    title: "Prospectar Parceiros Certos",
    intro: "Não é quantidade — é fit. Um parceiro errado consome energia sem gerar volume. O objetivo é identificar atores com volume real, clientes alinhados ao padrão AXO e disposição para relacionamento de longo prazo.",
    sections: [
      {
        title: "Critérios de qualificação",
        color: "#c9952a",
        items: [
          { t: "Tipo de parceiro", s: "GC · Builder · Designer · PM · Realtor · Handyman" },
          { t: "Volume estimado", s: "Quantos jobs/mês o parceiro pode gerar realisticamente" },
          { t: "Quality fit", s: "Padrão de cliente alinhado com posicionamento AXO" },
          { t: "Payment fit", s: "Termos de pagamento compatíveis com o fluxo de caixa AXO" },
          { t: "Território", s: "Dentro da área de operação atual — NJ counties alvo" },
        ],
      },
      {
        title: "Fontes de prospecção",
        color: "#c9952a",
        items: [
          { t: "Rede pessoal + indicações", s: "Mais rápido — parceiro indicado por quem já confia na AXO" },
          { t: "LinkedIn local", s: "Busca por GC e PM no NJ · conexão direta" },
          { t: "Eventos e feiras de construção", s: "Home shows · NAHB chapters · RE associations" },
          { t: "Cold outreach direcionado", s: "Door-to-door em obras ativas · email para RE offices" },
        ],
      },
    ],
  },

  "p-onboard": {
    color: "#c9952a",
    eyebrow: "Etapa 02 — Ativação",
    title: "Onboarding Profissional",
    intro: "A primeira impressão do parceiro com o sistema AXO. Um onboarding profissional sinaliza que AXO é uma empresa organizada — não um contractor individual.",
    sections: [
      {
        title: "Componentes do kit de onboarding",
        color: "#c9952a",
        items: [
          { t: "Welcome kit físico ou digital", s: "PDF com serviços · preços de referência · processo · contato direto" },
          { t: "Explicação do processo AXO", s: "Como funciona o agendamento · comunicação · entrega · garantia" },
          { t: "Definição de expectativas", s: "O que AXO entrega · o que o parceiro precisa fornecer · SLA" },
          { t: "Apresentação de compliance", s: "HIC · EPA RRP · insurance — prova de credibilidade" },
          { t: "Canal de comunicação dedicado", s: "WhatsApp ou email direto — não telefone geral" },
        ],
      },
    ],
  },

  "p-activate": {
    color: "#c9952a",
    eyebrow: "Etapa 03 — Prova",
    title: "Primeiro Job Ativo",
    intro: "O trial job é o momento de prova. Tudo o que foi prometido no onboarding é testado aqui. Um primeiro job impecável transforma um parceiro curioso em um parceiro comprometido.",
    sections: [
      {
        title: "O que precisa acontecer neste job",
        color: "#c9952a",
        items: [
          { t: "Prazo 100% cumprido", s: "Atraso no primeiro job = fim do canal antes de começar" },
          { t: "Comunicação proativa", s: "Updates sem o parceiro precisar perguntar · fotos durante a execução" },
          { t: "Qualidade acima da expectativa", s: "Surpreender positivamente é o objetivo — não apenas cumprir" },
          { t: "Processo de invoice claro", s: "Documentação profissional · pagamento fácil" },
          { t: "Feedback request imediato", s: "Perguntar explicitamente como foi — sinaliza comprometimento com qualidade" },
        ],
      },
    ],
  },

  "p-exec": {
    color: "#c9952a",
    eyebrow: "Etapa 04 — Padrão",
    title: "Execução Padrão AXO",
    intro: "O SOP de execução que todos os jobs do parceiro seguem. Consistência é o que transforma um bom primeiro job em confiança duradoura.",
    sections: [
      {
        title: "SOP de execução para partner jobs",
        color: "#c9952a",
        items: [
          { t: "Briefing pré-job", s: "Confirmação de escopo · material · acesso · timeline com parceiro" },
          { t: "Crew briefing", s: "Crew sabe que é job de parceiro — padrão extra de apresentação" },
          { t: "Fotos de before + processo + after", s: "Documentação padrão em todo job de parceiro" },
          { t: "Updates diários", s: "WhatsApp com status no final de cada dia de trabalho" },
          { t: "Walkthrough com aprovação", s: "Parceiro (ou cliente do parceiro) aprova antes de fechar" },
          { t: "Invoice com documentação", s: "Relatório de serviços executados + fotos para parceiro apresentar ao cliente final" },
        ],
      },
    ],
  },

  "p-integrate": {
    color: "#3aaa60",
    eyebrow: "Etapa 05 — Integração",
    title: "Integrar no Fluxo do Parceiro",
    intro: "O parceiro começa a incluir AXO automaticamente no próprio processo — sem precisar ser solicitado. Esse é o sinal de que o canal está funcionando.",
    sections: [
      {
        title: "Sinais de integração real",
        color: "#3aaa60",
        items: [
          { t: "Parceiro indica AXO sem ser perguntado", s: "Cliente pergunta flooring → parceiro manda contato AXO direto" },
          { t: "Jobs chegam sem outreach da AXO", s: "Inbound passivo via parceiro — CAC = $0" },
          { t: "Parceiro pede amostras ou materiais de apresentação", s: "Usa portfólio AXO em reuniões com clientes" },
          { t: "Parceiro dá feedback proativo", s: "Reporta o que o cliente disse sobre o serviço — relação de confiança" },
        ],
      },
      {
        title: "Como acelerar a integração",
        color: "#3aaa60",
        items: [
          { t: "Facilitar ao máximo a indicação", s: "Link direto · QR · mensagem pré-pronta para WhatsApp" },
          { t: "Reconhecer cada indicação", s: "Agradecer explicitamente toda indicação — reforça o comportamento" },
          { t: "Co-criar materiais", s: "Foto do projeto com crédito ao parceiro · post de Instagram conjunto" },
        ],
      },
    ],
  },

  "p-recur": {
    color: "#3aaa60",
    eyebrow: "Etapa 06 — Canal Ativo",
    title: "Gerar Recorrência",
    intro: "Canal ativo gera jobs regulares. Neste estágio, o parceiro está no Tier 2 (Preferred) e tem priority slots reservados na agenda AXO.",
    sections: [
      {
        title: "Mecanismos de recorrência",
        color: "#3aaa60",
        items: [
          { t: "Priority scheduling", s: "Parceiro Preferred tem slots reservados toda semana · não compete com agenda geral" },
          { t: "Orçamento em 24h", s: "SLA de resposta exclusivo · parceiro sabe que vai receber retorno rápido" },
          { t: "Volume discount", s: "Pricing melhor para parceiros com frequência comprovada" },
          { t: "Revisão trimestral", s: "Check-in de relacionamento · volume projetado · feedback · oportunidades" },
        ],
      },
    ],
  },

  "p-elite": {
    color: "#b090e0",
    eyebrow: "Etapa 07 — Canal Travado",
    title: "Fidelizar / Travar Canal",
    intro: "Parceiro Elite é um ativo estratégico. O canal está travado — mudar para outro contractor tem custo alto. AXO é o flooring partner padrão deste ator.",
    sections: [
      {
        title: "O que trava um canal",
        color: "#b090e0",
        items: [
          { t: "Histórico de confiança acumulado", s: "Anos de execução perfeita = custo de mudança alto para o parceiro" },
          { t: "Integração no processo interno", s: "AXO está no checklist de obra, no template de proposta, no contato salvo" },
          { t: "Benefícios exclusivos de Tier 3", s: "Co-marketing · revenue share · relatório mensal · portal exclusivo" },
          { t: "Relação pessoal com o dono", s: "Eduardo ↔ dono do parceiro — não é relação contractor/cliente" },
        ],
      },
    ],
    axo: { t: "Objetivo final", x: "Ter 8–12 parceiros Elite ativos que gerem 60–70% do volume da AXO de forma previsível — liberando o canal digital para crescimento adicional e testes de novos mercados." },
  },

  "tier-entry": {
    color: "#c0b870",
    eyebrow: "Tier 1",
    title: "Entry Partner",
    intro: "Parceiro que completou o primeiro job com sucesso. Qualificado, mas sem histórico de volume ainda.",
    sections: [
      {
        title: "Benefícios",
        color: "#c0b870",
        items: [
          { t: "Acesso ao processo padrão AXO", s: "SOP completo · kit de onboarding" },
          { t: "Suporte direto no 1º job", s: "Eduardo ou lead disponível para qualquer dúvida" },
          { t: "Avaliação pós-job", s: "Feedback estruturado para ambos os lados" },
          { t: "Elegível para upgrade", s: "Após 2 jobs satisfatórios → avaliação para Preferred" },
        ],
      },
    ],
    loopBox: { label: "Elegível para →", tags: ["Preferred após 2 jobs satisfatórios"] },
  },

  "tier-preferred": {
    color: "#c9952a",
    eyebrow: "Tier 2",
    title: "Preferred Partner",
    intro: "Histórico positivo, volume consistente, integrado no fluxo AXO. Recebe benefícios exclusivos de prioridade.",
    sections: [
      {
        title: "Benefícios Preferred",
        color: "#c9952a",
        items: [
          { t: "Priority scheduling semanal", s: "Slots reservados toda semana — não compete com agenda geral" },
          { t: "Orçamento em 24h garantido", s: "SLA exclusivo de resposta" },
          { t: "Volume discount", s: "Pricing melhor por volume comprovado" },
          { t: "Acesso a materiais premium", s: "Produto de maior qualidade disponível para jobs do parceiro" },
          { t: "Suporte dedicado", s: "Canal direto de comunicação — não fila geral" },
        ],
      },
    ],
    loopBox: { label: "Elegível para →", tags: ["Elite após volume e histórico"] },
  },

  "tier-elite": {
    color: "#c0a0f0",
    eyebrow: "Tier 3",
    title: "Elite Partner",
    intro: "Canal travado. Alto volume, recorrência previsível. Parceiro embaixador da marca AXO.",
    sections: [
      {
        title: "Benefícios Elite",
        color: "#c0a0f0",
        items: [
          { t: "Canal de comunicação exclusivo", s: "WhatsApp direto com Eduardo · resposta em <1h" },
          { t: "Co-marketing ativo", s: "Logo AXO nos materiais do parceiro · post conjunto no Instagram" },
          { t: "Revenue share em indicações", s: "% ou crédito por indicação fechada" },
          { t: "Priority scheduling garantido", s: "Slots bloqueados com antecedência de 30 dias" },
          { t: "Relatório mensal de performance", s: "Volume · ticket médio · satisfação · oportunidades" },
          { t: "Acesso ao FloorPRO Partner Portal", s: "Dashboard exclusivo de jobs · histórico · proposta express" },
        ],
      },
    ],
    axo: { t: "Meta de Elites ativos", x: "8–12 parceiros Elite gerando 60–70% do volume total da AXO com CAC próximo de zero." },
    loopBox: { label: "↻ canal travado", tags: ["Co-marketing · Revenue share · Partner Portal"] },
  },

  "p-recovery": {
    color: "#e07040",
    eyebrow: "Recovery Loop",
    title: "Feedback Loop — Parceiro Insatisfeito",
    intro: "Nem todo primeiro job é perfeito. O recovery bem feito pode salvar um canal que teria sido perdido — e demonstra profissionalismo que muitas vezes consolida a relação.",
    sections: [
      {
        title: "Processo de recovery",
        color: "#e07040",
        items: [
          { t: "Pesquisa de feedback estruturada", s: "Perguntas específicas — o que não foi bem · o que esperava · o que melhoraria" },
          { t: "Identificar causa-raiz", s: "Qualidade de execução · comunicação · prazo · expectativa mal alinhada" },
          { t: "Plano de ação específico", s: "Uma ação concreta por ponto de falha — não resposta genérica" },
          { t: "Job de recuperação", s: "Com desconto ou prioridade — prova de comprometimento" },
          { t: "Parceiro irrecuperável", s: "Archive com notas · não forçar · energia melhor investida em novo parceiro" },
        ],
      },
    ],
  },

  // ── TAB 3: MASTER FLOW ──
  "mf-discovery": {
    color: "#c9952a",
    eyebrow: "Fase 01 — Topo do Funil",
    title: "Discovery",
    intro: "Como a AXO é descoberta. Múltiplos canais simultâneos — cada um com custo e qualidade de lead diferente. O mix ideal combina digital de alta intenção com referral de baixo CAC.",
    sections: [
      {
        title: "Canais de discovery",
        color: "#c9952a",
        items: [
          { t: "Doorhanger + QR Code", s: "Hiperlocal · vizinhança · baixo custo · alta intenção geográfica" },
          { t: "Google Search / Maps", s: "Alta intenção · CPC disputado · converte bem com reviews e GBP otimizado" },
          { t: "Referral / Word of mouth", s: "CAC = $0 · maior taxa de conversão · depende de pós-venda bem feito" },
          { t: "Partner referral", s: "Realtors · GCs · PMs → indicação direta ao cliente final" },
          { t: "Instagram / Social", s: "Before/after content · brand awareness · demanda latente" },
          { t: "Cold outreach", s: "Direcionado a parceiros B2B · não a homeowners" },
        ],
      },
    ],
    axo: { t: "Estratégia de mix", x: "Prioridade 1: GBP + reviews para Google orgânico. Prioridade 2: doorhanger em zip codes alvo. Prioridade 3: ativar parceiros como canal de referral. Social como suporte de marca." },
  },

  "mf-entry": {
    color: "#c9952a",
    eyebrow: "Fase 02 — Entrada",
    title: "Entry Point",
    intro: "Onde o prospect faz o primeiro contato formal. A meta é reduzir fricção ao máximo — cada campo a mais no form reduz conversão.",
    sections: [
      {
        title: "Pontos de entrada",
        color: "#c9952a",
        items: [
          { t: "Landing page com quiz", s: "Rota preferida — qualifica antes de entrar no pipeline" },
          { t: "WhatsApp direto", s: "Rota rápida — especialmente para indicações de parceiros" },
          { t: "Ligação / direct call", s: "Clientes mais velhos ou urgentes · requer resposta imediata" },
          { t: "Formulário no site", s: "Assíncrono · não ideal para alta urgência" },
          { t: "Google Business Profile", s: '"Ligar" ou "Solicitar orçamento" direto da busca' },
        ],
      },
    ],
  },

  "mf-capture": {
    color: "#c9952a",
    eyebrow: "Fase 03 — Captura",
    title: "Lead Capture + Intent Detection",
    intro: "Captura os dados básicos e identifica o tipo de lead. O split Residential vs Partner determina qual pipeline segue — processos diferentes, expectativas diferentes.",
    sections: [
      {
        title: "Dados capturados",
        color: "#c9952a",
        items: [
          { t: "Nome e telefone", s: "Mínimo obrigatório — tudo começa aqui" },
          { t: "Email", s: "Para follow-up automatizado e proposta" },
          { t: "Tipo de projeto", s: "Refinish · instalação · reparo · manutenção" },
          { t: "Indicador de tipo", s: "Homeowner → Residential · GC/Builder/Designer → Partner" },
        ],
      },
      {
        title: "Intent detection",
        color: "#c9952a",
        items: [
          { t: "Perguntas de classificação no quiz", s: '"Você é dono do imóvel?" · "É para projeto de cliente?"' },
          { t: "Fonte de descoberta", s: "Realtor indicou → provavelmente urgente · Google → comparando preços" },
          { t: "Urgência declarada", s: '"Preciso para semana que vem" vs "Estou pesquisando"' },
        ],
      },
    ],
  },

  "mf-residential": {
    color: "#3aaa60",
    eyebrow: "Track A — Homeowner",
    title: "Residential Flow",
    intro: "Pipeline dedicado ao cliente final residencial. Mais emocional, maior margem, mais dependente de confiança e reviews.",
    sections: [
      {
        title: "Características do track",
        color: "#3aaa60",
        items: [
          { t: "Decisão emocional", s: "Homeowner compra confiança · não só preço" },
          { t: "Maior margem por job", s: "Sem intermediário · proposta direta · upsell possível" },
          { t: "Ciclo de venda mais curto", s: "Urgência frequente · decisão em 1–3 contatos" },
          { t: "Reviews são críticas", s: "Homeowner verifica Google antes de fechar · 5 estrelas é pré-requisito" },
        ],
      },
    ],
  },

  "mf-partner": {
    color: "#4a9ad4",
    eyebrow: "Track B — B2B",
    title: "Partner Flow",
    intro: "Pipeline dedicado a parceiros B2B. Mais racional, menor margem unitária, maior volume e recorrência.",
    sections: [
      {
        title: "Características do track",
        color: "#4a9ad4",
        items: [
          { t: "Decisão racional e processual", s: "Compliance · preço · prazo · processo — todos avaliados" },
          { t: "Volume e recorrência", s: "Um parceiro ativo > 10 clientes residenciais em volume anual" },
          { t: "Ciclo de venda mais longo", s: "Primeiro job é investimento de relacionamento" },
          { t: "Compliance como entrada", s: "Sem HIC e insurance, não há conversa" },
        ],
      },
    ],
  },

  "mf-quiz": {
    color: "#3aaa60",
    eyebrow: "Residential R1",
    title: "Project Quiz",
    intro: "Qualificação automatizada do projeto residencial. Coleta dados suficientes para gerar uma estimativa antes da visita.",
    sections: [
      {
        title: "Dados coletados no quiz",
        color: "#3aaa60",
        items: [
          { t: "Tamanho aproximado", s: "Em sqft ou número de cômodos" },
          { t: "Condição atual do piso", s: "Bom · médio · muito danificado · com stain atual" },
          { t: "Tipo de serviço desejado", s: "Refinish completo · recoat · instalação · reparo" },
          { t: "Timeline", s: "Urgente (< 2 sem) · próximo mês · pesquisando" },
          { t: "Budget range", s: "Opcional mas qualificante" },
        ],
      },
    ],
  },

  "mf-estimate": {
    color: "#3aaa60",
    eyebrow: "Residential R2",
    title: "Estimate Engine",
    intro: "Gera proposta automática em três pacotes — remove a fricção de esperar cotação manual para cada lead.",
    sections: [
      {
        title: "Estrutura dos pacotes",
        color: "#3aaa60",
        items: [
          { t: "Silver — Essencial", s: "Sand + 2 demãos oil-based · sem stain · preço de entrada" },
          { t: "Gold — Recomendado", s: "Sand + stain padrão + 3 demãos water-based · mais popular" },
          { t: "Platinum — Premium", s: "Sand + custom stain + Bona finish premium + garantia estendida" },
        ],
      },
      {
        title: "Upsells disponíveis",
        color: "#3aaa60",
        items: [
          { t: "Escadas", s: "Por lance ou degrau" },
          { t: "Reparos pontuais", s: "Board replacement · preenchimento de gaps" },
          { t: "Move furniture", s: "Incluir ou cobrar separado" },
        ],
      },
    ],
  },

  "mf-schedule": {
    color: "#3aaa60",
    eyebrow: "Residential R3",
    title: "Schedule + Follow-up",
    intro: "Agendamento e automação de follow-up. Meta: reduzir intervenção manual sem perder calor humano.",
    sections: [
      {
        title: "Fluxo de agendamento",
        color: "#3aaa60",
        items: [
          { t: "Self-serve booking link", s: "Calendly ou similar · cliente escolhe horário disponível" },
          { t: "Confirmação automática", s: "WhatsApp + email com detalhes da visita" },
          { t: "Pre-visit kit automático", s: "Instruções de preparação · o que esperar · contato direto" },
        ],
      },
      {
        title: "Follow-up de leads não fechados",
        color: "#3aaa60",
        items: [
          { t: "Day 1", s: '"Vi que você preencheu o quiz — posso tirar alguma dúvida?"' },
          { t: "Day 4", s: "Envio de caso similar antes/depois" },
          { t: "Day 10", s: '"Ainda pensando? Posso ajustar o pacote."' },
          { t: "Day 21", s: "Último contato — reativação em 90 dias" },
        ],
      },
    ],
  },

  "mf-pqualify": {
    color: "#4a9ad4",
    eyebrow: "Partner P1",
    title: "Partner Qualify",
    intro: "Qualificação manual do parceiro B2B. Mais criteriosa que o quiz residencial — o objetivo é entrar em relacionamentos de longo prazo com fit real.",
    sections: [
      {
        title: "Critérios de qualificação",
        color: "#4a9ad4",
        items: [
          { t: "Tipo e volume estimado", s: "GC ativo · builder com projetos em andamento · PM com portfólio" },
          { t: "Território e mercado", s: "Dentro da área AXO · perfil de cliente compatível" },
          { t: "Disposição para relacionamento", s: "Quer um parceiro de confiança ou só preço?" },
          { t: "Payment terms", s: "30 dias net é padrão B2B — AXO precisa ter capital para suportar" },
        ],
      },
    ],
  },

  "mf-contact": {
    color: "#4a9ad4",
    eyebrow: "Partner P2",
    title: "Initial Contact",
    intro: "Primeiro contato formal com o parceiro qualificado. O objetivo não é vender — é entender o negócio do parceiro e apresentar como AXO resolve um problema real dele.",
    sections: [
      {
        title: "Abordagem de contato",
        color: "#4a9ad4",
        items: [
          { t: "Pesquisar antes de ligar", s: "Entender projetos ativos · nível de operação · dores prováveis" },
          { t: "Abertura focada em dor", s: '"Você costuma precisar de flooring contractor de última hora?" → se sim, AXO resolve' },
          { t: "Apresentar compliance proativamente", s: "HIC · insurance · EPA RRP — antes de ser perguntado" },
          { t: "Propor um trial job", s: "Não um contrato · um job para provar qualidade sem compromisso" },
        ],
      },
    ],
  },

  "mf-firstjob": {
    color: "#4a9ad4",
    eyebrow: "Partner P3",
    title: "First Job Activation",
    intro: "O job que define o canal. Tudo o que foi prometido é testado. Não há segunda chance para primeira impressão — mas um primeiro job perfeito pode travar um canal por anos.",
    sections: [
      {
        title: "Checklist do primeiro job de parceiro",
        color: "#4a9ad4",
        items: [
          { t: "Briefing completo com parceiro", s: "Expectativas alinhadas antes de começar" },
          { t: "Equipe briefada sobre importância", s: "Crew sabe que é job estratégico" },
          { t: "Comunicação proativa durante", s: "Updates sem ser pedido · foto de progresso" },
          { t: "Entrega antes do prazo (se possível)", s: "Surpreender positivamente" },
          { t: "Walkthrough e feedback request", s: "Feedback imediato · demonstra comprometimento com qualidade" },
        ],
      },
    ],
  },

  "mf-production": {
    color: "#8a7ad4",
    eyebrow: "Fase 04 — Convergência",
    title: "Production Flow",
    intro: "Onde os dois tracks convergem. Todo job aprovado — residencial ou parceiro — entra no mesmo sistema de produção com o mesmo padrão de execução.",
    sections: [
      {
        title: "Etapas da produção",
        color: "#8a7ad4",
        items: [
          { t: "Project Planning", s: "Scope final · lista de materiais · schedule de crew" },
          { t: "Material ordering", s: "Abrasives · finish · stain — pedido com antecedência" },
          { t: "Crew assignment", s: "Lead crew definido · briefing de job" },
          { t: "Daily execution", s: "SOP de sanding → stain → finish com QC checkpoints" },
          { t: "Progress updates", s: "Foto de before · updates diários · foto de after" },
          { t: "Final walkthrough", s: "Cliente ou parceiro aprova presencialmente ou por foto" },
        ],
      },
    ],
  },

  "mf-postjob": {
    color: "#c9952a",
    eyebrow: "Fase 05–06 — Pós-job e Retenção",
    title: "Post-Job + Retention Loop",
    intro: "O sistema que transforma cada job em source de crescimento. Review + content + referral + retention — executados em sequência automatizada.",
    sections: [
      {
        title: "Sequência pós-job",
        color: "#c9952a",
        items: [
          { t: "Day 0 (conclusão)", s: "Review request via WhatsApp com link direto · fotos de after" },
          { t: "Day 1", s: "Agradecimento e envio de care instructions" },
          { t: "Day 7", s: "Check-in de satisfação · pergunta sobre indicações" },
          { t: "Day 30", s: 'Follow-up de manutenção · "Como está o piso?"' },
          { t: "Day 90 / Day 180", s: "Reativação · oportunidade de recoat ou novo projeto" },
        ],
      },
      {
        title: "Loops de retroalimentação",
        color: "#c9952a",
        items: [
          { t: "Reviews → Google ranking", s: "Volume e recência afetam posição no 3-pack local" },
          { t: "Referrals → Word of mouth", s: "Cliente satisfeito indica para vizinho · realtor · colega" },
          { t: "Content → Instagram", s: "Before/after vira discovery para novos clientes" },
          { t: "Partner recurrence", s: "Job de parceiro → priority slot → próximo job automático" },
        ],
      },
    ],
    axo: { t: "Meta do loop", x: "Cada job gera pelo menos 1 review de 5 estrelas + 1 contato de indicação potencial. Em 12 meses, isso compõe um volume de reviews e referrals que sustenta crescimento orgânico sem depender de ad spend." },
    loopBox: { label: "↻ loop fecha aqui", tags: ["Content → Discovery", "Reviews → Google ranking"] },
  },

  // ── TAB 4: OPERATIONAL ──
  "op-inbound": {
    color: "#c9952a",
    eyebrow: "Entrada — Topo do Sistema",
    title: "Inbound Sources",
    intro: "Todos os canais de entrada convergem para o mesmo router. O sistema não discrimina por canal — qualquer lead entra no mesmo processo de qualificação.",
    sections: [
      {
        title: "Canais de entrada",
        color: "#c9952a",
        items: [
          { t: "QR Code (doorhanger · truck · yard sign)", s: "Hiperlocal · alta intenção geográfica" },
          { t: "Cold outreach (email · ligação · visita)", s: "Proativo · usado principalmente para parceiros B2B" },
          { t: "Google Search / Maps / GBP", s: 'Alta intenção · "hardwood floor refinishing NJ"' },
          { t: "Referral (cliente · parceiro · realtor)", s: "CAC = $0 · maior taxa de conversão" },
          { t: "Instagram / Social", s: "Awareness + before/after · demanda gerada, não capturada" },
        ],
      },
    ],
  },

  "op-router": {
    color: "#c9952a",
    eyebrow: "Classificação — Router Central",
    title: "Intent Detection Router",
    intro: "Ponto de bifurcação do sistema. Identifica o tipo de lead e direciona para o pipeline correto — residencial ou parceiro. Processo diferente, expectativa diferente, SLA diferente.",
    sections: [
      {
        title: "Como funciona o roteamento",
        color: "#c9952a",
        items: [
          { t: "Quiz de entrada (automated)", s: "3–5 perguntas que identificam homeowner vs B2B automaticamente" },
          { t: "Pergunta direta no primeiro contato", s: '"O imóvel é seu?" · "Você é contractor / agente?"' },
          { t: "Fonte de lead como sinal", s: "Realtor indicou → provavelmente residencial urgente · GC entrou → Partner track" },
          { t: "Manual override", s: "Eduardo pode reclassificar qualquer lead manualmente no FloorPRO" },
        ],
      },
    ],
  },

  "op-c1": {
    color: "#3aaa60",
    eyebrow: "Residential C1 — Auto",
    title: "Qualify (Auto)",
    intro: "Qualificação automática via quiz. Sem intervenção manual até o lead provar que é qualificado. Economiza tempo e mantém pipeline limpo.",
    sections: [
      {
        title: "Quiz de qualificação",
        color: "#3aaa60",
        items: [
          { t: "Tipo de serviço", s: "Refinish · recoat · instalação · reparo" },
          { t: "Área aproximada", s: "< 500 sqft · 500–1500 · > 1500 sqft" },
          { t: "Condição do piso", s: "Boa · média · muito danificada" },
          { t: "Timeline", s: "Urgente · próximo mês · pesquisando" },
          { t: "Budget awareness", s: "Sabe o range? Sim/Não — qualificante" },
        ],
      },
      {
        title: "Critérios de desqualificação automática",
        color: "#3aaa60",
        items: [
          { t: "Fora da área de serviço", s: "Zip code fora do raio AXO → auto-resposta amigável" },
          { t: "Tipo de serviço não atendido", s: "Carpet · tile · LVP → redirect ou parceria" },
          { t: "Budget incompatível", s: "Expectativa muito abaixo do mínimo viável" },
        ],
      },
    ],
  },

  "op-c2": {
    color: "#3aaa60",
    eyebrow: "Residential C2 — Engine",
    title: "Estimate Engine (S/G/P)",
    intro: "Geração automática de proposta em três pacotes baseada nos dados do quiz. Reduz o tempo de resposta de dias para minutos.",
    sections: [
      {
        title: "Como o engine funciona",
        color: "#3aaa60",
        items: [
          { t: "Input: sqft + condição + serviço", s: "Quiz C1 alimenta o engine com esses três dados" },
          { t: "Fórmula de cálculo por pacote", s: "Silver: base por sqft · Gold: +20–30% · Platinum: +50–70%" },
          { t: "Output: PDF ou link de proposta", s: "Gerado automaticamente e enviado por WhatsApp ou email" },
          { t: "Validade de 7 dias", s: "Cria urgência sem pressionar explicitamente" },
        ],
      },
      {
        title: "Estrutura dos pacotes",
        color: "#3aaa60",
        items: [
          { t: "Silver", s: "Sand + 2 demãos oil-based polyurethane · preço de entrada" },
          { t: "Gold (recomendado)", s: "Sand + stain padrão + 3 demãos water-based · destaque visual na proposta" },
          { t: "Platinum", s: "Sand + custom stain + Bona Traffic HD + garantia 2 anos" },
        ],
      },
    ],
  },

  "op-c3": {
    color: "#3aaa60",
    eyebrow: "Residential C3 — Agendamento",
    title: "Schedule (Self-serve)",
    intro: "Cliente agenda a visita de estimativa sem precisar falar com ninguém. Disponível 24/7 — funciona enquanto a AXO está em campo.",
    sections: [
      {
        title: "Componentes do self-serve",
        color: "#3aaa60",
        items: [
          { t: "Link de agendamento (Calendly ou similar)", s: "Slots disponíveis baseados na agenda real da AXO" },
          { t: "Confirmação automática", s: "WhatsApp + email com data · hora · endereço · o que preparar" },
          { t: "Lembrete 24h antes", s: "Automático — reduz no-show" },
          { t: "Rescheduling self-serve", s: "Cliente pode remarcar sem ligar" },
        ],
      },
    ],
  },

  "op-c4": {
    color: "#3aaa60",
    eyebrow: "Residential C4 — Preparação",
    title: "Pre-Visit Kit",
    intro: "Kit enviado automaticamente após agendamento. Prepara o cliente, estabelece expectativas e demonstra profissionalismo antes do primeiro contato presencial.",
    sections: [
      {
        title: "Conteúdo do pre-visit kit",
        color: "#3aaa60",
        items: [
          { t: "O que esperar da visita", s: "Duração · o que será medido e fotografado · como funciona a proposta" },
          { t: "Como preparar o espaço", s: "Remover objetos pequenos · facilitar acesso · informar sobre pets" },
          { t: "Portfólio de trabalhos recentes", s: "3–5 before/after do mesmo tipo de serviço" },
          { t: "FAQ de objeções comuns", s: '"Quanto tempo dura?" · "Qual o cheiro?" · "Quando posso usar?"' },
          { t: "Contato direto", s: "WhatsApp do Eduardo para qualquer dúvida antes da visita" },
        ],
      },
    ],
  },

  "op-c5": {
    color: "#3aaa60",
    eyebrow: "Residential C5 — Decisão",
    title: "Close / Nurture",
    intro: "Ponto de decisão do lead residencial. Fechado vai para o Job DB. Não fechado entra em sequência de nurture — não é abandonado.",
    sections: [
      {
        title: "Se fechado",
        color: "#3aaa60",
        items: [
          { t: "Depósito + assinatura digital", s: "50% upfront · contrato simples · via WhatsApp ou DocuSign" },
          { t: "Entrada no Job DB (FloorPRO)", s: "Projeto criado · crew assigned · materiais pedidos" },
          { t: "Confirmação de schedule", s: "Data confirmada com cliente + crew" },
        ],
      },
      {
        title: "Se não fechado — nurture sequence",
        color: "#3aaa60",
        items: [
          { t: "Day 2", s: '"Vi que não avançamos — posso responder alguma dúvida?"' },
          { t: "Day 7", s: "Caso similar com foto + depoimento" },
          { t: "Day 14", s: '"Ainda pensando? Posso ajustar o pacote."' },
          { t: "Day 30", s: 'Check final — "Ainda é algo que você considera?"' },
          { t: "Day 90", s: 'Reativação automática — "Olá, vimos que você pesquisou conosco..."' },
        ],
      },
    ],
  },

  "op-d1": {
    color: "#4a9ad4",
    eyebrow: "Partner D1 — Score",
    title: "Partner Qualify (Score)",
    intro: "Qualificação do parceiro B2B com score estruturado. Mais criteriosa que a residencial — o objetivo é investir tempo apenas em parceiros com fit real e potencial de volume.",
    sections: [
      {
        title: "Critérios de scoring",
        color: "#4a9ad4",
        items: [
          { t: "Tipo de parceiro (0–3)", s: "Handyman=1 · Realtor=2 · Designer/PM=3 · GC/Builder=3" },
          { t: "Volume estimado (0–3)", s: "< 2 jobs/mês=1 · 2–5=2 · > 5=3" },
          { t: "Quality fit (0–2)", s: "Cliente compatível com padrão AXO" },
          { t: "Payment fit (0–2)", s: "Termos de pagamento viáveis para o fluxo AXO" },
          { t: "Score ≥ 7 → avançar", s: "Score < 7 → nurture ou arquivo" },
        ],
      },
    ],
  },

  "op-d2": {
    color: "#4a9ad4",
    eyebrow: "Partner D2 — Trial",
    title: "First Job Activation",
    intro: "Trial job do parceiro. Investimento de relacionamento — pode ter margem menor ou condições especiais para garantir que o parceiro experiencie o padrão AXO.",
    sections: [
      {
        title: "Configuração do trial job",
        color: "#4a9ad4",
        items: [
          { t: "Proposta de trial com desconto ou condições especiais", s: "Remove barreira de entrada · parceiro arrisca menos" },
          { t: "Briefing extra cuidadoso", s: "Expectativas super-alinhadas · sem espaço para surpresa negativa" },
          { t: "Crew mais experiente possível", s: "Job estratégico → melhor equipe disponível" },
          { t: "Documentação completa", s: "Fotos de before/during/after · relatório pós-job" },
        ],
      },
    ],
  },

  "op-d3": {
    color: "#4a9ad4",
    eyebrow: "Partner D3 — Execução",
    title: "Exec Experience",
    intro: "A experiência de execução que o parceiro terá em todos os jobs futuros. O padrão aqui é o padrão do canal.",
    sections: [
      {
        title: "SOP de execução para partner jobs",
        color: "#4a9ad4",
        items: [
          { t: "Briefing pré-job com parceiro", s: "Confirmação de escopo · acesso · timeline" },
          { t: "Updates diários via WhatsApp", s: "Status no fim de cada dia de trabalho" },
          { t: "Foto de before + after padrão", s: "Sempre · sem exceção" },
          { t: "Walkthrough com aprovação", s: "Parceiro (ou cliente do parceiro) aprova antes de fechar" },
          { t: "Invoice com documentação", s: "Relatório de serviços + fotos para parceiro apresentar ao cliente" },
        ],
      },
    ],
  },

  "op-d4": {
    color: "#4a9ad4",
    eyebrow: "Partner D4 — Database",
    title: "Onboarding (Partner DB)",
    intro: "Parceiro satisfeito entra no Partner Database do FloorPRO. A partir daqui, é gerenciado como ativo estratégico.",
    sections: [
      {
        title: "O que acontece no onboarding",
        color: "#4a9ad4",
        items: [
          { t: "Registro no Partner DB", s: "Nome · empresa · tipo · território · tier inicial · histórico" },
          { t: "Welcome kit formal", s: "PDF de boas-vindas · benefícios do tier · canal de comunicação" },
          { t: "Tier assignment", s: "Entry por padrão · avaliação para Preferred após 2 jobs" },
          { t: "Priority slots configurados", s: "Para Preferred e Elite · bloqueio antecipado de agenda" },
        ],
      },
    ],
  },

  "op-d5": {
    color: "#4a9ad4",
    eyebrow: "Partner D5 — Canal",
    title: "Recurring Slots",
    intro: "Canal estabelecido. Parceiro tem slots reservados na agenda AXO — não compete com demanda geral. É aqui que o canal começa a gerar volume previsível.",
    sections: [
      {
        title: "Mecânica de recurring slots",
        color: "#4a9ad4",
        items: [
          { t: "Slots semanais bloqueados", s: "Ex: toda terça é reservada para jobs de parceiros Preferred" },
          { t: "Request express", s: "Parceiro solicita job → cotação em 24h · confirmação em 48h" },
          { t: "Volume tracking", s: "Parceiro vê histórico e projeta próximos jobs no Partner Portal" },
          { t: "Upgrade automático de tier", s: "Volume atinge threshold → notificação de upgrade para Elite" },
        ],
      },
    ],
  },

  "op-jobdb": {
    color: "#8a7ad4",
    eyebrow: "Convergência",
    title: "Job DB — Production SOP",
    intro: "Ponto de convergência dos dois tracks. Todo job aprovado entra no Job Database do FloorPRO com o mesmo SOP de produção.",
    sections: [
      {
        title: "O que acontece no Job DB",
        color: "#8a7ad4",
        items: [
          { t: "Registro do projeto", s: "Cliente · escopo · sqft · serviço · pacote · preço · crew assigned" },
          { t: "Material planning", s: "Lista de abrasives · finish · stain · underlayment pedidos" },
          { t: "Schedule confirmado", s: "Data de início · duração estimada · crew schedule" },
          { t: "SOP checklist ativado", s: "Checklist digital de execução para o crew" },
          { t: "Comunicação ativada", s: "Updates automáticos para cliente ou parceiro durante execução" },
        ],
      },
    ],
  },

  "op-completion": {
    color: "#30c4a8",
    eyebrow: "Qualidade",
    title: "Completion + QA",
    intro: "Etapa final de qualidade antes do fechamento financeiro. Sem aprovação do cliente, o job não fecha.",
    sections: [
      {
        title: "Processo de conclusão",
        color: "#30c4a8",
        items: [
          { t: "Final walkthrough", s: "Cliente ou parceiro inspeciona o resultado — ao vivo ou por foto/vídeo" },
          { t: "Punch list", s: "Qualquer item pendente é registrado e executado antes do fechamento" },
          { t: "Aprovação formal", s: "Confirmação escrita (WhatsApp serve) de que o cliente aprovou" },
          { t: "Invoice enviado", s: "Imediatamente após aprovação · com detalhamento de serviços" },
          { t: "Pagamento coletado", s: "50% upfront já pago · 50% na conclusão · pix · check · zelle" },
          { t: "Warranty letter", s: "Carta de garantia enviada junto com care instructions" },
        ],
      },
    ],
  },

  "op-review": {
    color: "#c9952a",
    eyebrow: "Motor G — Reviews",
    title: "Review Engine",
    intro: "Sistema de solicitação de reviews que funciona em automação. O objetivo é maximizar volume e recência de reviews no Google — os dois fatores que mais afetam ranking local.",
    sections: [
      {
        title: "Fluxo do review engine",
        color: "#c9952a",
        items: [
          { t: "Day 0 — Request imediato", s: "WhatsApp com link direto para Google Review · enviado na hora da conclusão" },
          { t: "Day 2 — Reminder", s: "Se não respondeu · mensagem leve de lembrete" },
          { t: "Day 7 — Final reminder", s: "Último contato para review · não forçar além disso" },
          { t: "NPS interno", s: "Pergunta de satisfação 0–10 para uso interno · identifica clientes insatisfeitos antes de pedir Google review" },
        ],
      },
      {
        title: "Impacto do review engine",
        color: "#c9952a",
        items: [
          { t: "Google 3-pack ranking", s: "Volume + recência + rating afetam diretamente posição local" },
          { t: "Conversão do GBP", s: "Mais reviews = mais confiança = mais ligações e mensagens" },
          { t: "Social proof para parceiros", s: "Parceiros verificam Google antes de indicar AXO" },
        ],
      },
    ],
  },

  "op-content": {
    color: "#3aaa60",
    eyebrow: "Motor H — Conteúdo",
    title: "Content Engine → Loop",
    intro: "Sistema de captura e publicação de conteúdo que fecha o loop — transformando cada job executado em source de novos jobs.",
    sections: [
      {
        title: "Captura de conteúdo",
        color: "#3aaa60",
        items: [
          { t: "Foto de before (obrigatória)", s: "Tirada antes de qualquer trabalho em todo job" },
          { t: "Foto de after (obrigatória)", s: "Após conclusão · mesmo ângulo · boa luz" },
          { t: "Vídeo de processo (quando possível)", s: "Sanding · aplicação de stain · resultado final" },
          { t: "Depoimento em vídeo (alta prioridade)", s: "30 segundos do cliente falando sobre resultado" },
        ],
      },
      {
        title: "Distribuição e loop",
        color: "#3aaa60",
        items: [
          { t: "Instagram (before/after)", s: "Post + stories · tag de localização · hashtags locais" },
          { t: "Google Business Profile", s: "Fotos adicionadas ao perfil · melhora rankeamento" },
          { t: "Portfolio no site", s: "Case study com fotos · tipo de serviço · cidade" },
          { t: "Proposta comercial", s: "Fotos de jobs similares usadas em novas propostas" },
          { t: "→ Volta ao Inbound Sources", s: "Conteúdo alimenta descoberta de novos leads" },
        ],
      },
    ],
    axo: { t: "Loop fechado", x: "Discovery → Lead → Job → Review + Content → Discovery. Cada job bem documentado é um ativo que gera novos jobs. Em 12 meses de operação consistente, o conteúdo acumulado sustenta crescimento orgânico." },
    loopBox: { label: "↻ loop fecha aqui", tags: ["Content → Discovery", "Reviews → Google ranking"] },
  },
};

// ══════════════════════════════════════════════
// TAB CONFIGURATIONS (nodes + arrows + layout)
// ══════════════════════════════════════════════
export const TABS: TabConfig[] = [
  {
    id: "influence",
    label: "01 · Influência Local",
    paneLabel: "Tab 01",
    paneTitle: "Mapa de Influência Local",
    paneSub: "AXO no centro — 8 atores ao redor que influenciam o cliente e indicam diretamente. Clique em cada um.",
    chartWidth: 700,
    chartHeight: 560,
    nodes: [
      { id: "axo-center", tag: "⬡ Centro", title: "AXO Floors", subtitle: "Execução · Confiança · Marca", color: "axo", x: 285, y: 238, w: 130, h: 80 },
      { id: "inf-realtors", tag: "Indicação", title: "Realtors", subtitle: "Urgência alta · pré-listing", color: "pine", x: 291, y: 20, w: 118 },
      { id: "inf-builders", tag: "Volume", title: "Builders", subtitle: "Jobs recorrentes · B2B", color: "pine", x: 530, y: 100, w: 118 },
      { id: "inf-re", tag: "Multiplica", title: "Real Estate Co.", subtitle: "Portfólio de agentes", color: "pine", x: 560, y: 248, w: 118 },
      { id: "inf-pm", tag: "Recorrência", title: "Property Managers", subtitle: "Unidades · turn previsível", color: "pine", x: 530, y: 390, w: 118 },
      { id: "inf-designers", tag: "Premium", title: "Interior Designers", subtitle: "Alto LTV · especificação", color: "violet", x: 291, y: 460, w: 118 },
      { id: "inf-arq", tag: "Projetos", title: "Arquitetos", subtitle: "Ciclo longo · alto ticket", color: "violet", x: 50, y: 390, w: 118 },
      { id: "inf-gcs", tag: "B2B direto", title: "GCs", subtitle: "Trade partner · frequência", color: "violet", x: 20, y: 248, w: 118 },
      { id: "inf-handyman", tag: "Indicação quente", title: "Handymans", subtitle: "Indicam specialist", color: "violet", x: 50, y: 100, w: 118 },
    ],
    arrows: [
      { from: "inf-realtors", to: "axo-center" }, { from: "inf-builders", to: "axo-center" },
      { from: "inf-re", to: "axo-center" }, { from: "inf-pm", to: "axo-center" },
      { from: "inf-designers", to: "axo-center" }, { from: "inf-arq", to: "axo-center" },
      { from: "inf-gcs", to: "axo-center" }, { from: "inf-handyman", to: "axo-center" },
    ],
  },
  {
    id: "partner",
    label: "02 · Partner Program",
    paneLabel: "Tab 02",
    paneTitle: "AXO Partner Program",
    paneSub: "Jornada do parceiro — da prospecção ao canal travado. Clique em cada etapa ou tier.",
    chartWidth: 860,
    chartHeight: 420,
    nodes: [
      { id: "p-prospect", tag: "01", title: "Prospectar", subtitle: "GC · Builder · Designer · PM", color: "gold", x: 20, y: 60, w: 108 },
      { id: "p-onboard", tag: "02", title: "Onboarding", subtitle: "Kit · processo · expectativas", color: "gold", x: 148, y: 60, w: 108 },
      { id: "p-activate", tag: "03", title: "1º Job Ativo", subtitle: "Trial · prova de qualidade", color: "gold", x: 276, y: 60, w: 108 },
      { id: "p-exec", tag: "04", title: "Execução AXO", subtitle: "SOP · updates · QC", color: "gold", x: 404, y: 60, w: 108 },
      { id: "p-integrate", tag: "05", title: "Integrar Fluxo", subtitle: "AXO no processo do parceiro", color: "pine", x: 532, y: 60, w: 108 },
      { id: "p-recur", tag: "06", title: "Recorrência", subtitle: "Priority slots · volume", color: "pine", x: 660, y: 60, w: 108 },
      { id: "p-elite", tag: "07", title: "Fidelizar", subtitle: "Canal travado · escala", color: "violet", x: 788, y: 60, w: 108 },
      { id: "tier-entry", tag: "Tier 1", title: "Entry Partner", subtitle: "1º job concluído · qualificado", color: "gold", x: 80, y: 230, w: 200 },
      { id: "tier-preferred", tag: "Tier 2", title: "Preferred Partner", subtitle: "Volume consistente · priority slots", color: "gold", x: 330, y: 230, w: 200 },
      { id: "tier-elite", tag: "Tier 3", title: "Elite Partner", subtitle: "Canal travado · co-marketing", color: "violet", x: 580, y: 230, w: 200 },
      { id: "p-recovery", tag: "Recovery", title: "Feedback Loop", subtitle: "Job insatisfatório → plano", color: "ember", x: 300, y: 340, w: 140 },
    ],
    arrows: [
      { from: "p-prospect", to: "p-onboard" }, { from: "p-onboard", to: "p-activate" },
      { from: "p-activate", to: "p-exec" }, { from: "p-exec", to: "p-integrate" },
      { from: "p-integrate", to: "p-recur" }, { from: "p-recur", to: "p-elite" },
      { from: "p-activate", to: "p-recovery", dashed: true },
      { from: "p-recovery", to: "p-activate", dashed: true },
      { from: "p-onboard", to: "tier-entry", dashed: true },
      { from: "p-recur", to: "tier-preferred", dashed: true },
      { from: "p-elite", to: "tier-elite", dashed: true },
    ],
  },
  {
    id: "masterflow",
    label: "03 · Master Flow",
    paneLabel: "Tab 03",
    paneTitle: "Master Flow System",
    paneSub: "Pipeline completo — Discovery ao Loop. Dual track Residential / Partner convergindo em Produção.",
    chartWidth: 700,
    chartHeight: 900,
    nodes: [
      { id: "mf-discovery", tag: "Fase 01", title: "Discovery", subtitle: "Doorhanger · Google · Referral · Social", color: "gold", x: 250, y: 10, w: 200 },
      { id: "mf-entry", tag: "Fase 02", title: "Entry Point", subtitle: "Landing page · Form · Quiz", color: "gold", x: 250, y: 110, w: 200 },
      { id: "mf-capture", tag: "Fase 03", title: "Lead Capture", subtitle: "Nome · Phone · Email · Tipo", color: "gold", x: 250, y: 210, w: 200 },
      { id: "mf-residential", tag: "Track A", title: "Residential Flow", subtitle: "Homeowner / Seller / Buyer", color: "pine", x: 60, y: 330, w: 160 },
      { id: "mf-partner", tag: "Track B", title: "Partner Flow", subtitle: "GC · Builder · Designer · PM", color: "steel", x: 480, y: 330, w: 160 },
      { id: "mf-quiz", tag: "R1", title: "Project Quiz", subtitle: "Size · Condition · Budget", color: "pine", x: 65, y: 430, w: 150 },
      { id: "mf-estimate", tag: "R2", title: "Estimate Engine", subtitle: "Silver · Gold · Platinum", color: "pine", x: 65, y: 510, w: 150 },
      { id: "mf-schedule", tag: "R3", title: "Schedule + Follow-up", subtitle: "Automation · nurture", color: "pine", x: 65, y: 590, w: 150 },
      { id: "mf-pqualify", tag: "P1", title: "Partner Qualify", subtitle: "GC · Builder · Designer", color: "steel", x: 485, y: 430, w: 150 },
      { id: "mf-contact", tag: "P2", title: "Initial Contact", subtitle: "Call · Message · Meeting", color: "steel", x: 485, y: 510, w: 150 },
      { id: "mf-firstjob", tag: "P3", title: "First Job Activation", subtitle: "Trial experience", color: "steel", x: 485, y: 590, w: 150 },
      { id: "mf-production", tag: "Fase 04", title: "Production Flow", subtitle: "Planning · Execution · Completion", color: "violet", x: 250, y: 700, w: 200 },
      { id: "mf-postjob", tag: "Fase 05–06", title: "Post-Job + Retention", subtitle: "Review · Content · Loop", color: "gold", x: 250, y: 800, w: 200 },
    ],
    arrows: [
      { from: "mf-discovery", to: "mf-entry" }, { from: "mf-entry", to: "mf-capture" },
      { from: "mf-capture", to: "mf-residential" }, { from: "mf-capture", to: "mf-partner" },
      { from: "mf-residential", to: "mf-quiz" }, { from: "mf-quiz", to: "mf-estimate" },
      { from: "mf-estimate", to: "mf-schedule" },
      { from: "mf-partner", to: "mf-pqualify" }, { from: "mf-pqualify", to: "mf-contact" },
      { from: "mf-contact", to: "mf-firstjob" },
      { from: "mf-schedule", to: "mf-production" }, { from: "mf-firstjob", to: "mf-production" },
      { from: "mf-production", to: "mf-postjob" },
      { from: "mf-postjob", to: "mf-discovery", dashed: true },
    ],
  },
  {
    id: "operational",
    label: "04 · Sistema Operacional",
    paneLabel: "Tab 04",
    paneTitle: "Sistema Operacional AXO",
    paneSub: "Engenharia do pipeline — dual track C1–C5 (Residential) e D1–D5 (Partner) convergindo no Job DB.",
    chartWidth: 860,
    chartHeight: 700,
    nodes: [
      // Top: Inbound + Router
      { id: "op-inbound", tag: "Entrada", title: "Inbound Sources", subtitle: "QR · Outreach · Google · Referral", color: "gold", x: 340, y: 20, w: 180 },
      { id: "op-router", tag: "Router", title: "Intent Detection", subtitle: "Homeowner vs Partner", color: "gold", x: 355, y: 120, w: 150 },
      // Left column: Residential C1–C5
      { id: "op-c1", tag: "C1", title: "Qualify (Auto)", subtitle: "Quiz automático", color: "pine", x: 30, y: 230, w: 140 },
      { id: "op-c2", tag: "C2", title: "Estimate Engine", subtitle: "S/G/P automático", color: "pine", x: 30, y: 310, w: 140 },
      { id: "op-c3", tag: "C3", title: "Schedule", subtitle: "Self-serve booking", color: "pine", x: 30, y: 390, w: 140 },
      { id: "op-c4", tag: "C4", title: "Pre-Visit Kit", subtitle: "Enviado automaticamente", color: "pine", x: 30, y: 470, w: 140 },
      { id: "op-c5", tag: "C5", title: "Close / Nurture", subtitle: "Fechado → Job DB", color: "pine", x: 30, y: 550, w: 140 },
      // Right column: Partner D1–D5
      { id: "op-d1", tag: "D1", title: "Partner Qualify", subtitle: "Score automático", color: "steel", x: 690, y: 230, w: 140 },
      { id: "op-d2", tag: "D2", title: "First Job Activation", subtitle: "Trial job", color: "steel", x: 690, y: 310, w: 140 },
      { id: "op-d3", tag: "D3", title: "Exec Experience", subtitle: "SOP · QC · updates", color: "steel", x: 690, y: 390, w: 140 },
      { id: "op-d4", tag: "D4", title: "Partner DB", subtitle: "Onboarding completo", color: "steel", x: 690, y: 470, w: 140 },
      { id: "op-d5", tag: "D5", title: "Recurring Slots", subtitle: "Canal estabelecido", color: "steel", x: 690, y: 550, w: 140 },
      // Center: convergence
      { id: "op-jobdb", tag: "Convergência", title: "Job DB", subtitle: "Production SOP", color: "violet", x: 365, y: 390, w: 130 },
      { id: "op-completion", tag: "Qualidade", title: "Completion + QA", subtitle: "Walkthrough · invoice", color: "teal", x: 365, y: 490, w: 130 },
      // Bottom: engines
      { id: "op-review", tag: "Motor G", title: "Review Engine", subtitle: "Google · NPS", color: "gold", x: 240, y: 600, w: 150 },
      { id: "op-content", tag: "Motor H", title: "Content Engine", subtitle: "Before/after → loop", color: "pine", x: 470, y: 600, w: 150 },
    ],
    arrows: [
      { from: "op-inbound", to: "op-router" },
      { from: "op-router", to: "op-c1" }, { from: "op-router", to: "op-d1" },
      { from: "op-c1", to: "op-c2" }, { from: "op-c2", to: "op-c3" },
      { from: "op-c3", to: "op-c4" }, { from: "op-c4", to: "op-c5" },
      { from: "op-c5", to: "op-jobdb" },
      { from: "op-d1", to: "op-d2" }, { from: "op-d2", to: "op-d3" },
      { from: "op-d3", to: "op-d4" }, { from: "op-d4", to: "op-d5" },
      { from: "op-d5", to: "op-jobdb" },
      { from: "op-jobdb", to: "op-completion" },
      { from: "op-completion", to: "op-review" }, { from: "op-completion", to: "op-content" },
      { from: "op-content", to: "op-inbound", dashed: true },
    ],
  },
];
