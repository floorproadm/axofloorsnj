import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  exportable?: boolean;
  title?: string;
  description?: string;
  isLoading?: boolean;
  onExport?: () => void;
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Buscar...",
  filterable = false,
  exportable = false,
  title,
  description,
  isLoading = false,
  onExport,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = table.getState().pagination.pageIndex * pageSize + 1;
  const endRow = Math.min(startRow + pageSize - 1, totalRows);

  if (isLoading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
              {description && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {totalRows} {totalRows === 1 ? 'registro' : 'registros'}
              </Badge>
              {exportable && onExport && (
                <Button variant="outline" size="sm" onClick={onExport} className="h-8">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Exportar</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Filters and Search */}
        {(searchable || filterable) && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {searchable && (
              <div className="relative flex-1 max-w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            )}
            
            {filterable && (
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-10">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            )}
          </div>
        )}

        {/* Mobile Card View - Visible only on small screens */}
        <div className="block sm:hidden">
          {table.getRowModel().rows?.length ? (
            <div className="space-y-3">
              {table.getRowModel().rows.map((row) => (
                <Card key={row.id} className="p-3">
                  <div className="space-y-2">
                    {row.getVisibleCells().map((cell, index) => {
                      const header = table.getHeaderGroups()[0]?.headers[index];
                      const headerText = header ? 
                        flexRender(header.column.columnDef.header, header.getContext()) : '';
                      
                      return (
                        <div key={cell.id} className="flex justify-between items-center">
                          <div className="text-xs font-medium text-muted-foreground min-w-0 flex-shrink-0 mr-3">
                            {headerText}
                          </div>
                          <div className="text-sm font-medium text-right min-w-0 flex-1">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Search className="w-8 h-8" />
                <p className="text-sm">Nenhum resultado encontrado</p>
                {globalFilter && (
                  <p className="text-xs text-center">
                    Tente ajustar sua pesquisa: "<span className="font-medium">{globalFilter}</span>"
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Desktop Table View - Hidden on small screens */}
        <div className="hidden sm:block">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead 
                          key={header.id}
                          className={`${header.column.getCanSort() ? "cursor-pointer select-none" : ""} whitespace-nowrap`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {header.column.getCanSort() && (
                              <div className="flex flex-col">
                                {header.column.getIsSorted() === "asc" && (
                                  <SortAsc className="w-4 h-4" />
                                )}
                                {header.column.getIsSorted() === "desc" && (
                                  <SortDesc className="w-4 h-4" />
                                )}
                                {!header.column.getIsSorted() && (
                                  <div className="w-4 h-4 opacity-50">
                                    <SortAsc className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="whitespace-nowrap">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Search className="w-8 h-8" />
                          <p>Nenhum resultado encontrado</p>
                          {globalFilter && (
                            <p className="text-sm">
                              Tente ajustar sua pesquisa: "<span className="font-medium">{globalFilter}</span>"
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between px-2 py-4 border-t">
            <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              Mostrando {startRow} a {endRow} de {totalRows} resultados
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 order-1 sm:order-2">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Linhas por página</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[60px] sm:w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                
                <div className="text-xs sm:text-sm font-medium px-2">
                  {currentPage} de {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}