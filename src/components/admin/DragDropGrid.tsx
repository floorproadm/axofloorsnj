import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Star, Edit, Trash2, Eye, Image } from 'lucide-react';

interface DragDropItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  isFeatured?: boolean;
  order: number;
}

interface DragDropGridProps {
  items: DragDropItem[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onEdit?: (item: DragDropItem) => void;
  onDelete?: (item: DragDropItem) => void;
  onToggleFeatured?: (item: DragDropItem) => void;
  type: 'project' | 'folder';
}

export const DragDropGrid: React.FC<DragDropGridProps> = ({
  items,
  onReorder,
  onEdit,
  onDelete,
  onToggleFeatured,
  type
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string, index: number) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, newIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const oldIndex = items.findIndex(item => item.id === draggedItem);
    
    if (oldIndex !== -1 && oldIndex !== newIndex) {
      onReorder(oldIndex, newIndex);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Image className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No {type}s yet</h3>
        <p className="text-muted-foreground">
          Create your first {type} to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <Card
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`relative group cursor-move transition-all ${
            draggedItem === item.id 
              ? 'opacity-50 scale-95' 
              : dragOverIndex === index
              ? 'scale-105 shadow-lg border-primary'
              : 'hover:shadow-md'
          }`}
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="p-1 bg-background/80 rounded cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
            {type === 'project' && onToggleFeatured && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFeatured(item);
                }}
              >
                <Star className={`w-4 h-4 ${item.isFeatured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
              </Button>
            )}
            
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between pr-16">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate flex items-center gap-2">
                  {item.title}
                  {item.isFeatured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                </CardTitle>
                
                {(item.category || item.location) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                    {item.location && (
                      <Badge variant="outline" className="text-xs">
                        {item.location}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Image */}
            {item.imageUrl && (
              <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {item.description}
              </p>
            )}

            {/* Order indicator */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Order: {item.order + 1}</span>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Drag to reorder</span>
              </div>
            </div>
          </CardContent>

          {/* Drop indicator */}
          {dragOverIndex === index && draggedItem !== item.id && (
            <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-lg pointer-events-none" />
          )}
        </Card>
      ))}
    </div>
  );
};