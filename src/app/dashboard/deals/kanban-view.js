// src/app/dashboard/deals/kanban-view.js
'use client'

import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Building2, DollarSign, User, GripVertical, Calendar } from 'lucide-react'
import Link from 'next/link'
// PARTNER STAGES - Only up to closed_lost
const PARTNER_STAGES = [
  { id: 'new_deal', label: 'New Deal', color: 'bg-gray-100 border-gray-300' },
  { id: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' }
]

// Deal Card Component (Draggable)
function DealCard({ deal, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(amount)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm hover:shadow-md transition-shadow cursor-move group"
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-xs truncate">
            {deal.customer_name}
          </h4>
          <p className="text-[10px] text-gray-600 truncate mt-0.5">
            {deal.customer_company}
          </p>
        </div>
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Deal Value */}
      <div className="flex items-center text-xs font-semibold text-green-600 mb-2">
        <DollarSign className="h-3 w-3 mr-1" />
        {formatCurrency(deal.deal_value)}
      </div>

      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(deal.priority)}`}></div>
          <span className="text-[10px] text-gray-600 capitalize">{deal.priority}</span>
        </div>
        <div className="text-[10px] text-gray-500 flex items-center">
          <Calendar className="h-2.5 w-2.5 mr-0.5" />
          {new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Open Deal Link */}
      <Link
        href={`/dashboard/deals/${deal.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block w-full text-center px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-medium rounded transition-colors mt-2"
      >
        Open Deal
      </Link>
    </div>
  )
}

// Column Component (Drop Zone)
function KanbanColumn({ stage, deals, activeId }) {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: {
      type: 'column',
      stage: stage.id,
    },
  })

  const dealsInStage = deals.filter(deal => deal.stage === stage.id)
  const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(amount)
  }

  return (
    <div className="flex flex-col w-56 flex-shrink-0 bg-gray-50 rounded-lg">
      {/* Column Header */}
      <div className={`p-3 border-b-4 rounded-t-lg ${stage.color}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-xs">{stage.label}</h3>
          <span className="bg-white px-1.5 py-0.5 rounded-full text-[10px] font-medium text-gray-700">
            {dealsInStage.length}
          </span>
        </div>
        <div className="text-[10px] font-medium text-gray-600">
          {formatCurrency(totalValue)}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 overflow-y-auto min-h-[500px] max-h-[calc(100vh-300px)]"
      >
        <SortableContext items={dealsInStage.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {dealsInStage.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              isDragging={activeId === deal.id}
            />
          ))}
        </SortableContext>

        {dealsInStage.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  )
}

// Main Kanban Board Component
export default function KanbanView({ deals, onDealUpdate }) {
  const [activeId, setActiveId] = useState(null)
  const [localDeals, setLocalDeals] = useState(deals)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the active deal
    const activeDeal = localDeals.find(d => d.id === activeId)
    if (!activeDeal) return

    // Determine the target stage
    let targetStage

    // Check if we're over a column
    if (PARTNER_STAGES.find(s => s.id === overId)) {
      targetStage = overId
    } else {
      // We're over another deal, find its stage
      const overDeal = localDeals.find(d => d.id === overId)
      if (overDeal) {
        targetStage = overDeal.stage
      }
    }

    // Update local state if stage changed
    if (targetStage && activeDeal.stage !== targetStage) {
      setLocalDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === activeId ? { ...deal, stage: targetStage } : deal
        )
      )
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeId = active.id
    const activeDeal = localDeals.find(d => d.id === activeId)

    if (!activeDeal) return

    // Update in database
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: activeDeal.stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeId)

      if (error) throw error

      // Log activity
      await supabase
        .from('deal_activities')
        .insert([{
          deal_id: activeId,
          activity_type: 'stage_updated',
          description: `Stage updated to ${PARTNER_STAGES.find(s => s.id === activeDeal.stage)?.label}`
        }])

      // Notify parent component
      if (onDealUpdate) {
        onDealUpdate(localDeals)
      }
    } catch (error) {
      console.error('Error updating deal:', error)
      // Revert on error
      setLocalDeals(deals)
    }
  }

  const activeDeal = activeId ? localDeals.find(d => d.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        <SortableContext items={PARTNER_STAGES.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {PARTNER_STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={localDeals}
              activeId={activeId}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="bg-white rounded-lg border-2 border-blue-500 p-4 shadow-xl rotate-3 cursor-grabbing">
            <h4 className="font-semibold text-gray-900 text-sm">
              {activeDeal.customer_name}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {activeDeal.customer_company}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}