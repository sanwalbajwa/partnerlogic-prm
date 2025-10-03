// src/app/admin/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Users, BarChart3, FileText, TrendingUp, DollarSign,
  AlertCircle, CheckCircle, Clock, Award, ArrowRight
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalDeals: 0,
    totalPipelineValue: 0,
    openTickets: 0,
    knowledgeArticles: 0,
    pendingMDFRequests: 0
  })
  const [recentDeals, setRecentDeals] = useState([])
  const [recentPartners, setRecentPartners] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
  try {
    setLoading(true)

    // Get total partners count
    const { count: partnersCount } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })

    // Get total deals and calculate pipeline value
    const { data: dealsData } = await supabase
      .from('deals')
      .select('deal_value')

    const dealsCount = dealsData?.length || 0
    const pipelineValue = dealsData?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0

    // Get open tickets count
    const { count: openTicketsCount } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])

    // Get knowledge articles count
    const { count: articlesCount } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })

    // Get pending MDF requests count (if table exists)
    const { count: mdfCount } = await supabase
      .from('mdf_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get recent deals with partner info
    const { data: recentDealsData } = await supabase
      .from('deals')
      .select(`
        *,
        partners!inner(
          id,
          first_name,
          last_name,
          organizations!inner(
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent partners with organization
    const { data: recentPartnersData } = await supabase
      .from('partners')
      .select(`
        *,
        organizations!inner(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('Stats:', {
      partnersCount,
      dealsCount,
      pipelineValue,
      openTicketsCount,
      articlesCount,
      mdfCount
    })
    console.log('Recent Deals:', recentDealsData)
    console.log('Recent Partners:', recentPartnersData)

    setStats({
      totalPartners: partnersCount || 0,
      totalDeals: dealsCount,
      totalPipelineValue: pipelineValue,
      openTickets: openTicketsCount || 0,
      knowledgeArticles: articlesCount || 0,
      pendingMDFRequests: mdfCount || 0
    })

    setRecentDeals(recentDealsData || [])
    setRecentPartners(recentPartnersData || [])

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    setLoading(false)
  }
}

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

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

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Overview of your partner ecosystem and platform activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Partners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPartners}</p>
                <p className="text-sm text-gray-600">Total Partners</p>
              </div>
            </div>
            <Link 
              href="/admin/partners"
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View Partners <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Total Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
            </div>
            <Link 
              href="/admin/deals"
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              View All Deals <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Pipeline Value */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPipelineValue)}</p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          {/* Open Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                <p className="text-sm text-gray-600">Open Tickets</p>
              </div>
            </div>
          </div>

          {/* Knowledge Articles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.knowledgeArticles}</p>
                <p className="text-sm text-gray-600">Knowledge Articles</p>
              </div>
            </div>
            <Link 
              href="/admin/knowledge"
              className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
            >
              Manage Content <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Pending MDF */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pendingMDFRequests}</p>
                <p className="text-sm text-gray-600">Pending MDF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Deals</h3>
                <Link 
                  href="/admin/deals"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentDeals.length > 0 ? (
                recentDeals.map((deal) => (
                  <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {deal.customer_name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {deal.customer_company} • {formatCurrency(deal.deal_value)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Partner: {deal.partners?.first_name} {deal.partners?.last_name} ({deal.partners?.organizations?.name})
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
                  <p className="text-gray-600">No deals yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Partners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Partners</h3>
                <Link 
                  href="/admin/partners"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentPartners.length > 0 ? (
                recentPartners.map((partner) => (
                  <div key={partner.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {partner.first_name} {partner.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{partner.organization?.name}</p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(partner.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          partner.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                          partner.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                          partner.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {partner.organization?.tier?.charAt(0).toUpperCase() + partner.organization?.tier?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No partners yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}