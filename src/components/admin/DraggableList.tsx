import React, { useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, GripHorizontal } from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface DraggableItem {
  id: string;
  [key: string]: unknown;
}

interface DraggableListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  className?: string;
  itemClassName?: string;
  dragHandleClassName?: string;
  disabled?: boolean;
  showDragHandles?: boolean;
}

// =============================================================================
// DRAGGABLE LIST COMPONENT
// =============================================================================

const DraggableList = <T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
  direction = 'vertical',
  className = '',
  itemClassName = '',
  dragHandleClassName = '',
  disabled = false,
  showDragHandles = true
}: DraggableListProps<T>) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((result: DropResult) => {
    if (disabled) return;
    
    setIsDragging(true);
    setDraggedItemId(result.draggableId);
  }, [disabled]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((result: DropResult) => {
    if (disabled) return;
    
    setIsDragging(false);
    setDraggedItemId(null);

    // If the item was dropped in a valid location
    if (result.destination && result.destination.index !== result.source.index) {
      const newItems = Array.from(items);
      const [removed] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, removed);
      
      onReorder(newItems);
    }
  }, [disabled, items, onReorder]);

  /**
   * Handle drag update (for visual feedback)
   */
  const handleDragUpdate = useCallback((result: DropResult) => {
    if (disabled) return;
    
    // You can add additional visual feedback here if needed
  }, [disabled]);

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render drag handle
   */
  const renderDragHandle = (itemId: string) => {
    if (!showDragHandles) return null;
    
    const Icon = direction === 'vertical' ? GripVertical : GripHorizontal;
    
    return (
      <div 
        className={`drag-handle ${dragHandleClassName}`}
        data-testid={`drag-handle-${itemId}`}
      >
        <Icon className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
      </div>
    );
  };

  /**
   * Render individual item
   */
  const renderDraggableItem = (item: T, index: number) => {
    const isItemDragging = draggedItemId === item.id;
    
    return (
      <Draggable 
        key={item.id} 
        draggableId={item.id} 
        index={index}
        isDragDisabled={disabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`
              draggable-item
              ${itemClassName}
              ${snapshot.isDragging ? 'dragging' : ''}
              ${isItemDragging ? 'item-being-dragged' : ''}
              transition-all duration-200 ease-in-out
              ${direction === 'vertical' ? 'mb-2' : 'mr-2'}
            `}
            style={{
              ...provided.draggableProps.style,
              transform: snapshot.isDragging 
                ? provided.draggableProps.style?.transform 
                : 'none'
            }}
          >
            {/* Drag Handle */}
            <div 
              {...provided.dragHandleProps}
              className="flex items-center justify-center"
            >
              {renderDragHandle(item.id)}
            </div>
            
            {/* Item Content */}
            <div className="flex-1">
              {renderItem(item, index, snapshot.isDragging)}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (disabled) {
    return (
      <div className={`draggable-list-disabled ${className}`}>
        {items.map((item, index) => (
          <div key={item.id} className={`disabled-item ${itemClassName}`}>
            {renderItem(item, index, false)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragUpdate={handleDragUpdate}
    >
      <Droppable 
        droppableId="draggable-list"
        direction={direction}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              draggable-list
              ${className}
              ${snapshot.isDraggingOver ? 'drag-over' : ''}
              ${isDragging ? 'is-dragging' : ''}
              ${direction === 'vertical' ? 'space-y-2' : 'flex space-x-2'}
            `}
          >
            {items.map((item, index) => renderDraggableItem(item, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableList; 