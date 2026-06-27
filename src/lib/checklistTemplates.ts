export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  hardwood: [
    "Verificar umidade do subpiso (< 12%)",
    "Nivelar subpiso",
    "Aclimatar material 48h",
    "Instalar underlayment",
    "Instalar o piso",
    "Aplicar acabamento",
    "Limpeza final",
    "Fotos before/after",
  ],
  refinish: [
    "Lijar grão 36",
    "Lijar grão 60",
    "Lijar grão 100",
    "Aplicar stain (se solicitado)",
    "1ª demão de acabamento",
    "Lixar levemente",
    "2ª demão de acabamento",
    "Fotos finais",
  ],
  laminate: [
    "Verificar nivelamento do subpiso",
    "Instalar vapor barrier",
    "Instalar o laminado",
    "Instalar rodapés",
    "Limpeza final",
    "Fotos before/after",
  ],
};

export const CHECKLIST_TEMPLATE_LABELS: Record<string, string> = {
  hardwood: "Hardwood (Instalação)",
  refinish: "Refinish (Lixamento)",
  laminate: "Laminado",
};
