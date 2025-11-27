export interface SalesStep {
  id: number;
  title: string;
  subtitle: string;
  sections: {
    heading: string;
    text?: string;
    items?: string[];
    highlight?: string;
  }[];
}

export const salesSteps: SalesStep[] = [
  {
    id: 1,
    title: "First Contact",
    subtitle: "AXO™ Smart Sales System",
    sections: [
      {
        heading: "Objetivo",
        text: "Criar confiança imediata, assumir o controle e abrir o processo de qualificação.",
      },
      {
        heading: "Checklist",
        items: [
          "Perguntar tipo de piso atual",
          "Identificar objetivo do projeto",
          "Confirmar localização",
          "Criar rapport e segurança",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Para te ajudar da melhor forma, posso te fazer 3 perguntas rápidas?'",
      },
      {
        heading: "Ações Internas",
        items: [
          "Registrar lead no CRM",
          "Marcar como Qualified / Not Qualified",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Qualification Filter",
    subtitle: "AXO™ Smart Sales System",
    sections: [
      {
        heading: "Objetivo",
        text: "Eliminar clientes tóxicos e evitar visitas desnecessárias.",
      },
      {
        heading: "Checklist",
        items: [
          "Mora na casa? Está vazia?",
          "Tem pets?",
          "Refinishing ou instalação?",
          "Cor desejada?",
          "Timeline real?",
          "Investimento mínimo?",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Quero garantir que você receba a melhor orientação possível.'",
      },
      {
        heading: "Ações Internas",
        items: [
          "Se qualificado → enviar WOW Pack",
          "Se não qualificado → encerrar com elegância",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "AXO WOW Pack",
    subtitle: "Pre-Sale Experience",
    sections: [
      {
        heading: "Objetivo",
        text: "Criar encantamento e autoridade antes da visita técnica.",
      },
      {
        heading: "Checklist",
        items: [
          "História da AXO",
          "Woody's Guarantee",
          "Antes & Depois",
          "Guia de Stains",
          "Processo Explicado",
          "Cuidados Pré e Pós",
          "Opções Silver/Gold/Platinum",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Antes de nos encontrarmos, quero te mostrar como trabalhamos.'",
      },
    ],
  },
  {
    id: 4,
    title: "Triage Call",
    subtitle: "AXO™ Smart Sales System",
    sections: [
      {
        heading: "Objetivo",
        text: "Garantir alinhamento total antes da visita.",
      },
      {
        heading: "Checklist",
        items: [
          "Confirmar medidas",
          "Confirmar pets",
          "Validar expectativas",
          "Alinhar timeline",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Quero que você se sinta 100% confiante antes da visita.'",
      },
    ],
  },
  {
    id: 5,
    title: "Smart Site Visit",
    subtitle: "Technical + Experience",
    sections: [
      {
        heading: "Objetivo",
        text: "Ganhar o cliente com técnica e postura premium.",
      },
      {
        heading: "Checklist",
        items: [
          "Medir ambientes",
          "Checar subfloor",
          "Verificar danos",
          "Testar stains ao vivo",
          "Explicar processo",
          "Mostrar segurança técnica",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Quero te mostrar exatamente como esse piso pode ficar.'",
      },
    ],
  },
  {
    id: 6,
    title: "Strategy Session",
    subtitle: "Consultative Selling",
    sections: [
      {
        heading: "Objetivo",
        text: "Ajudar o cliente a tomar a decisão correta para os próximos anos.",
      },
      {
        heading: "Checklist",
        items: [
          "Cor ideal",
          "Acabamento ideal",
          "Timeline real",
          "Cuidados essenciais",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Vou te orientar como se fosse minha própria casa.'",
      },
    ],
  },
  {
    id: 7,
    title: "Premium Proposal",
    subtitle: "AXO™ Presentation",
    sections: [
      {
        heading: "Objetivo",
        text: "Apresentar uma proposta clara, visual e convincente.",
      },
      {
        heading: "Checklist",
        items: [
          "Silver/Gold/Platinum",
          "Timeline visual",
          "Opção de stain",
          "Woody's Guarantee",
          "Investimento claro",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'A decisão agora é só escolher o pacote que melhor se encaixa.'",
      },
    ],
  },
  {
    id: 8,
    title: "Project Confirmation",
    subtitle: "Client Alignment",
    sections: [
      {
        heading: "Objetivo",
        text: "Organizar tudo para o início sem surpresas.",
      },
      {
        heading: "Checklist",
        items: [
          "Invoice + Depósito",
          "Datas oficiais",
          "Cuidados pré-obra",
          "Acesso e chaves",
          "Foto da equipe",
        ],
      },
    ],
  },
  {
    id: 9,
    title: "Execution Alignment",
    subtitle: "Job Day Zero",
    sections: [
      {
        heading: "Objetivo",
        text: "Garantir operação impecável antes do time começar.",
      },
      {
        heading: "Checklist",
        items: [
          "Revisão do subfloor",
          "Checagem do clima",
          "Revisão da timeline",
          "Máquinas em ordem",
          "Organização do espaço",
        ],
      },
    ],
  },
  {
    id: 10,
    title: "Handover & Lifetime Care",
    subtitle: "Client for Life",
    sections: [
      {
        heading: "Objetivo",
        text: "Encerrar com excelência e fidelizar o cliente.",
      },
      {
        heading: "Checklist",
        items: [
          "Tour final",
          "Cuidados iniciais",
          "Produtos recomendados",
          "Fotos finais",
          "Review",
        ],
      },
      {
        heading: "Frase-chave AXO",
        highlight: "'Qualquer coisa que notar, fale direto comigo. Isso é a Woody's Guarantee.'",
      },
    ],
  },
];
