// src/app/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  BarChart3, TrendingUp, DollarSign, Users, Clock, 
  Plus, ArrowRight, AlertCircle, CheckCircle, 
  Activity, Calendar, FileText, Star
} from 'lucide-react'

export default function DashboardPage() {
  const [partner, setPartner] = useState(null)
  const [deals, setDeals] = useState([])
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    totalDeals: 0,
    pipelineValue: 0,
    activeTickets: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Get partner profile with organization
        const { data: partnerData } = await supabase
          .from('partners')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('auth_user_id', user.id)
          .single()

        if (partnerData) {
          setPartner(partnerData)

          // Get deals
          const { data: dealsData } = await supabase
            .from('deals')
            .select('*')
            .eq('partner_id', partnerData.id)
            .order('created_at', { ascending: false })
            .limit(5)

          // Get support tickets
          const { data: ticketsData } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('partner_id', partnerData.id)
            .order('created_at', { ascending: false })
            .limit(5)

          // Calculate stats
          const { data: allDeals } = await supabase
            .from('deals')
            .select('deal_value, stage')
            .eq('partner_id', partnerData.id)

          const { data: activeTicketsData } = await supabase
            .from('support_tickets')
            .select('id')
            .eq('partner_id', partnerData.id)
            .in('status', ['open', 'in_progress'])

          if (dealsData) setDeals(dealsData)
          if (ticketsData) setTickets(ticketsData)

          // Calculate statistics
          const totalDeals = allDeals?.length || 0
          const pipelineValue = allDeals?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0
          const closedWonDeals = allDeals?.filter(deal => deal.stage === 'closed_won').length || 0
          const conversionRate = totalDeals > 0 ? Math.round((closedWonDeals / totalDeals) * 100) : 0

          setStats({
            totalDeals,
            pipelineValue,
            activeTickets: activeTicketsData?.length || 0,
            conversionRate
          })
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase])

  const getStageColor = (stage) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800'
      case 'qualified': return 'bg-blue-100 text-blue-800'
      case 'proposal': return 'bg-yellow-100 text-yellow-800'
      case 'negotiation': return 'bg-purple-100 text-purple-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTicketStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {partner?.first_name}!
                </h1>
                <p className="text-blue-100 text-lg">
                  {partner?.organization?.name} • {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Partner
                </p>
                <p className="text-blue-200 mt-2">
                  Here's your performance overview and recent activity
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                    <div className="text-sm text-blue-200">Win Rate</div>
                  </div>
                  <div className="w-px h-12 bg-blue-400"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{deals.length}</div>
                    <div className="text-sm text-blue-200">Active Deals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats.pipelineValue / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.activeTickets}</p>
                <p className="text-sm text-gray-600">Open Tickets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Deals</h2>
                <Link 
                  href="/dashboard/deals"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {deals.length > 0 ? (
                deals.map((deal) => (
                  <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {deal.customer_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {deal.customer_company} • ${deal.deal_value?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                          {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No deals yet</p>
                  <Link
                    href="/dashboard/deals"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register Your First Deal
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Support Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
                <Link 
                  href="/dashboard/support"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {ticket.type} • {ticket.priority} priority
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                          {ticket.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No open tickets</p>
                  <Link
                    href="/dashboard/support"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Support Ticket
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/deals"
            className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Register New Deal</h3>
                <p className="text-sm text-gray-600">Start tracking a new opportunity</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/support"
            className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Get Support</h3>
                <p className="text-sm text-gray-600">Create a support ticket</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/knowledge"
            className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Resources</h3>
                <p className="text-sm text-gray-600">Access knowledge base</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Partner Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Partner Performance</h2>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900">
                {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Tier
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{stats.totalDeals}</div>
              <div className="text-sm text-gray-600 mt-1">Total Deals Registered</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">${(stats.pipelineValue / 1000).toFixed(0)}K</div>
              <div className="text-sm text-gray-600 mt-1">Total Pipeline Value</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Deal Win Rate</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Tier Progression</h3>
                <p className="text-sm text-blue-700">
                  You're currently a {partner?.organization?.tier} partner. Keep registering deals to advance to the next tier!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}