import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface DragSortItem {
  id: string
  display_order: number
}

interface UseDragSortProps<T extends DragSortItem> {
  items: T[]
  onReorder: (items: T[]) => void
  tableName: string
}

export function useDragSort<T extends DragSortItem>({
  items,
  onReorder,
  tableName
}: UseDragSortProps<T>) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)
  const dragCounter = useRef(0)
  const touchTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    
    // Add dragging class
    const element = e.currentTarget as HTMLElement
    setTimeout(() => {
      element.classList.add('dragging')
    }, 0)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragCounter.current++
    if (draggedItem !== null && draggedItem !== index) {
      setDragOverItem(index)
    }
  }, [draggedItem])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverItem(null)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    dragCounter.current = 0
    
    const element = e.currentTarget as HTMLElement
    element.classList.remove('dragging')
    element.classList.remove('drag-over')
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const newItems = [...items]
    const draggedItemData = newItems[draggedItem]
    
    // Remove dragged item
    newItems.splice(draggedItem, 1)
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItemData)
    
    // Update display_order for all affected items
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }))
    
    onReorder(updatedItems)
    
    // Update database
    try {
      const updates = updatedItems.map(item => ({
        id: item.id,
        display_order: item.display_order
      }))
      
      for (const update of updates) {
        await supabase
          .from(tableName)
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      }
    } catch (error) {
      console.error('Failed to update display order:', error)
    }
    
    setDraggedItem(null)
    setDragOverItem(null)
  }, [draggedItem, items, onReorder, tableName])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement
    element.classList.remove('dragging')
    setDraggedItem(null)
    setDragOverItem(null)
    dragCounter.current = 0
  }, [])

  // Touch support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    touchTimeout.current = setTimeout(() => {
      setDraggedItem(index)
      const element = e.currentTarget as HTMLElement
      element.classList.add('dragging')
    }, 500) // Long press for 500ms
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current)
      touchTimeout.current = null
    }
    
    if (draggedItem === null) return
    
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    
    if (element) {
      const dropTarget = element.closest('[data-drag-index]')
      if (dropTarget) {
        const dropIndex = parseInt(dropTarget.getAttribute('data-drag-index') || '0')
        if (dropIndex !== draggedItem && dropIndex !== dragOverItem) {
          setDragOverItem(dropIndex)
        }
      }
    }
  }, [draggedItem, dragOverItem])

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current)
      touchTimeout.current = null
    }
    
    const element = e.currentTarget as HTMLElement
    element.classList.remove('dragging')
    
    if (draggedItem === null || dragOverItem === null) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }
    
    // Same reorder logic as handleDrop
    const newItems = [...items]
    const draggedItemData = newItems[draggedItem]
    
    newItems.splice(draggedItem, 1)
    newItems.splice(dragOverItem, 0, draggedItemData)
    
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }))
    
    onReorder(updatedItems)
    
    // Update database
    try {
      const updates = updatedItems.map(item => ({
        id: item.id,
        display_order: item.display_order
      }))
      
      for (const update of updates) {
        await supabase
          .from(tableName)
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      }
    } catch (error) {
      console.error('Failed to update display order:', error)
    }
    
    setDraggedItem(null)
    setDragOverItem(null)
  }, [draggedItem, dragOverItem, items, onReorder, tableName])

  const dragHandlers = useCallback((index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
    onDragEnter: (e: React.DragEvent) => handleDragEnter(e, index),
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: (e: React.DragEvent) => handleDrop(e, index),
    onDragEnd: handleDragEnd,
    onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, index),
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    'data-drag-index': index,
    className: dragOverItem === index ? 'drag-over' : ''
  }), [
    handleDragStart,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    dragOverItem
  ])

  return {
    dragHandlers,
    isDragging: draggedItem !== null,
    draggedIndex: draggedItem,
    dragOverIndex: dragOverItem
  }
}