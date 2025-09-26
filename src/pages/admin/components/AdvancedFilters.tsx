import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  MapPin,
  DollarSign,
  User,
  Phone,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  search: string;
  status: string[];
  priority: string[];
  source: string[];
  services: string[];
  city: string[];
  budgetMin?: number;
  budgetMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  followUpOverdue: boolean;
  notContacted: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableOptions: {
    cities: string[];
    services: string[];
    sources: string[];
  };
  totalResults: number;
  isOpen: boolean;
  onToggle: () => void;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Novos', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contatados', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'qualified', label: 'Qualificados', color: 'bg-purple-100 text-purple-800' },
  { value: 'proposal', label: 'Proposta Enviada', color: 'bg-orange-100 text-orange-800' },
  { value: 'converted', label: 'Convertidos', color: 'bg-green-100 text-green-800' },
  { value: 'lost', label: 'Perdidos', color: 'bg-red-100 text-red-800' }
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' }
];

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableOptions,
  totalResults,
  isOpen,
  onToggle
}: AdvancedFiltersProps) {
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = <K extends keyof Pick<FilterOptions, 'status' | 'priority' | 'source' | 'services' | 'city'>>(
    key: K,
    value: string
  ) => {
    const currentArray = tempFilters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray as FilterOptions[K]);
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
  };

  const resetFilters = () => {
    const resetFilters: FilterOptions = {
      search: '',
      status: [],
      priority: [],
      source: [],
      services: [],
      city: [],
      budgetMin: undefined,
      budgetMax: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      followUpOverdue: false,
      notContacted: false
    };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.source.length > 0) count++;
    if (filters.services.length > 0) count++;
    if (filters.city.length > 0) count++;
    if (filters.budgetMin || filters.budgetMax) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.followUpOverdue) count++;
    if (filters.notContacted) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={onToggle}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros Avançados</span>
            <span className="sm:hidden">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Limpar filtros</span>
              <span className="sm:hidden">Limpar</span>
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
          <span>{totalResults} resultados</span>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              <Search className="w-3 h-3" />
              <span className="max-w-20 truncate">"{filters.search}"</span>
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFiltersChange({ ...filters, search: '' })}
              />
            </Badge>
          )}
          
          {filters.status.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              <span className="truncate">{STATUS_OPTIONS.find(s => s.value === status)?.label}</span>
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  status: filters.status.filter(s => s !== status)
                })}
              />
            </Badge>
          ))}
          
          {filters.city.map(city => (
            <Badge key={city} variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              <span className="max-w-16 truncate">{city}</span>
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  city: filters.city.filter(c => c !== city)
                })}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {isOpen && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm">Buscar por nome, email ou telefone</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite sua busca..."
                  value={tempFilters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(option => (
                  <Badge
                    key={option.value}
                    variant={tempFilters.status.includes(option.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-xs",
                      tempFilters.status.includes(option.value) ? option.color : ""
                    )}
                    onClick={() => toggleArrayFilter('status', option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm">Prioridade</Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map(option => (
                  <Badge
                    key={option.value}
                    variant={tempFilters.priority.includes(option.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-xs",
                      tempFilters.priority.includes(option.value) ? option.color : ""
                    )}
                    onClick={() => toggleArrayFilter('priority', option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Source */}
            {availableOptions.sources.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Fonte do Lead</Label>
                <div className="flex flex-wrap gap-2">
                  {availableOptions.sources.map(source => (
                    <Badge
                      key={source}
                      variant={tempFilters.source.includes(source) ? "default" : "outline"}
                      className="cursor-pointer transition-all text-xs"
                      onClick={() => toggleArrayFilter('source', source)}
                    >
                      {source.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Range */}
            <div className="space-y-2">
              <Label className="text-sm">Orçamento</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="budgetMin" className="text-xs text-muted-foreground">Mínimo</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budgetMin"
                      type="number"
                      placeholder="0"
                      value={tempFilters.budgetMin || ''}
                      onChange={(e) => updateFilter('budgetMin', e.target.value ? Number(e.target.value) : undefined)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="budgetMax" className="text-xs text-muted-foreground">Máximo</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder="50000"
                      value={tempFilters.budgetMax || ''}
                      onChange={(e) => updateFilter('budgetMax', e.target.value ? Number(e.target.value) : undefined)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm">Período de Criação</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">De</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !tempFilters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {tempFilters.dateFrom ? format(tempFilters.dateFrom, "dd/MM/yyyy") : "Selecionar"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tempFilters.dateFrom}
                        onSelect={(date) => updateFilter('dateFrom', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Até</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !tempFilters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {tempFilters.dateTo ? format(tempFilters.dateTo, "dd/MM/yyyy") : "Selecionar"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tempFilters.dateTo}
                        onSelect={(date) => updateFilter('dateTo', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <Label className="text-sm">Filtros Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={tempFilters.notContacted ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => updateFilter('notContacted', !tempFilters.notContacted)}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Não contatados
                </Badge>
                <Badge
                  variant={tempFilters.followUpOverdue ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => updateFilter('followUpOverdue', !tempFilters.followUpOverdue)}
                >
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  Follow-up atrasado
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t">
              <Button onClick={applyFilters} className="flex-1 h-10">
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={resetFilters} className="sm:w-auto h-10">
                Limpar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}