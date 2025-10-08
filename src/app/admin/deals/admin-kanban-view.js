// src/app/admin/deals/admin-kanban-view.js
'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Building2, DollarSign, User, GripVertical, Calendar } from 'lucide-react'

// ADMIN STAGES - URS to LIVE (Implementation stages only)
const ADMIN_STAGES = [
  { id: 'urs', label: 'URS', color: 'bg-cyan-100 border-cyan-300' },
  { id: 'base_deployment', label: 'Base Deployment', color: 'bg-indigo-100 border-indigo-300' },
  { id: 'gap_assessment', label: 'Gap Assessment', color: 'bg-pink-100 border-pink-300' },
  { id: 'development', label: 'Development', color: 'bg-orange-100 border-orange-300' },
  { id: 'uat', label: 'UAT', color: 'bg-teal-100 border-teal-300' },
  { id: 'iq', label: 'IQ', color: 'bg-lime-100 border-lime-300' },
  { id: 'oq', label: 'OQ', color: 'bg-amber-100 border-amber-300' },
  { id: 'deployment', label: 'Deployment', color: 'bg-emerald-100 border-emerald-300' },
  { id: 'pq', label: 'PQ', color: 'bg-violet-100 border-violet-300' },
  { id: 'live', label: 'LIVE', color: 'bg-green-200 border-green-400' }
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
      minimumFractionDigits: 0
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

  // Get partner sales stage badge
  const getSalesStageColor = (stage) => {
    switch (stage) {
      case 'new_deal': return 'bg-gray-100 text-gray-700'
      case 'need_analysis': return 'bg-blue-100 text-blue-700'
      case 'proposal': return 'bg-yellow-100 text-yellow-700'
      case 'negotiation': return 'bg-purple-100 text-purple-700'
      case 'closed_won': return 'bg-green-100 text-green-700'
      case 'closed_lost': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSalesStageLabel = (stage) => {
    const labels = {
      'new_deal': 'New',
      'need_analysis': 'Analysis',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed_won': 'Won',
      'closed_lost': 'Lost'
    }
    return labels[stage] || stage
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-move group"
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">
            {deal.customer_name}
          </h4>
          <p className="text-xs text-gray-600 truncate mt-1">
            {deal.customer_company}
          </p>
        </div>
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Sales Stage Badge */}
      {deal.stage && (
        <div className="mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSalesStageColor(deal.stage)}`}>
            Sales: {getSalesStageLabel(deal.stage)}
          </span>
        </div>
      )}

      {/* Deal Value */}
      <div className="flex items-center text-sm font-semibold text-green-600 mb-3">
        <DollarSign className="h-4 w-4 mr-1" />
        {formatCurrency(deal.deal_value)}
      </div>

      {/* Priority & Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(deal.priority)}`}></div>
          <span className="text-xs text-gray-600 capitalize">{deal.priority}</span>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Partner Info */}
      {deal.partner && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate">{deal.partner.first_name} {deal.partner.last_name}</span>
          </div>
        </div>
      )}
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

  const dealsInStage = deals.filter(deal => deal.admin_stage === stage.id)
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
    <div className="flex flex-col w-80 flex-shrink-0 bg-gray-50 rounded-lg">
      {/* Column Header */}
      <div className={`p-4 border-b-4 rounded-t-lg ${stage.color}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{stage.label}</h3>
          <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
            {dealsInStage.length}
          </span>
        </div>
        <div className="text-xs font-medium text-gray-600">
          {formatCurrency(totalValue)}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 overflow-y-auto min-h-[500px] max-h-[calc(100vh-300px)]"
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
          <div className="text-center py-8 text-gray-400 text-sm">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  )
}

// Main Kanban Board Component for Admin
export default function AdminKanbanView({ deals, onDealUpdate }) {
  const [activeId, setActiveId] = useState(null)
  // Ensure all deals have admin_stage set
  const dealsWithAdminStage = deals.map(deal => ({
    ...deal,
    admin_stage: deal.admin_stage || 'urs'
  }))
  const [localDeals, setLocalDeals] = useState(dealsWithAdminStage)
  const supabase = createClient()

  // Update local deals when parent deals change
  useEffect(() => {
    const updatedDeals = deals.map(deal => ({
      ...deal,
      admin_stage: deal.admin_stage || 'urs'
    }))
    setLocalDeals(updatedDeals)
  }, [deals])

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
    if (ADMIN_STAGES.find(s => s.id === overId)) {
      targetStage = overId
    } else {
      // We're over another deal, find its admin_stage
      const overDeal = localDeals.find(d => d.id === overId)
      if (overDeal) {
        targetStage = overDeal.admin_stage
      }
    }

    // Update local state if admin_stage changed
    if (targetStage && activeDeal.admin_stage !== targetStage) {
      setLocalDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === activeId ? { ...deal, admin_stage: targetStage } : deal
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

    const newAdminStage = activeDeal.admin_stage
    const oldAdminStage = deals.find(d => d.id === activeId)?.admin_stage || 'urs'

    // Don't update if stage hasn't changed
    if (newAdminStage === oldAdminStage) return

    console.log('Updating deal:', activeId, 'from', oldAdminStage, 'to', newAdminStage)

    // Update in database - only update admin_stage
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({
          admin_stage: newAdminStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeId)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Update successful:', data)

      // Log activity
      await supabase
        .from('deal_activities')
        .insert([{
          deal_id: activeId,
          activity_type: 'stage_updated',
          description: `Implementation stage updated to ${ADMIN_STAGES.find(s => s.id === newAdminStage)?.label}`
        }])

      // Notify parent component with updated deals
      if (onDealUpdate) {
        const updatedDeals = deals.map(deal => 
          deal.id === activeId ? { ...deal, admin_stage: newAdminStage } : deal
        )
        onDealUpdate(updatedDeals)
      }
    } catch (error) {
      console.error('Error updating deal admin stage:', error)
      alert('Failed to update deal stage. Please try again.')
      // Revert on error
      setLocalDeals(dealsWithAdminStage)
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
        <SortableContext items={ADMIN_STAGES.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {ADMIN_STAGES.map(stage => (
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