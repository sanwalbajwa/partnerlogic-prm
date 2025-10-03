// src/app/admin/deals/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Eye, DollarSign, Calendar, User,
  Building2, ChevronDown, BarChart3, TrendingUp
} from 'lucide-react'

export default function AdminAllDealsPage() {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [partners, setPartners] = useState([])

  const supabase = createClient()

  const stages = [
    { value: 'all', label: 'All Stages', color: 'bg-gray-100 text-gray-800' },
    { value: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-800' },
    { value: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-800' },
    { value: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 text-purple-800' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    loadDeals()
    loadPartners()
  }, [])

  useEffect(() => {
    filterAndSortDeals()
  }, [deals, searchTerm, stageFilter, partnerFilter, sortBy, sortOrder])

  const loadDeals = async () => {
    try {
      setLoading(true)
      
      const { data: dealsData, error } = await supabase
        .from('deals')
        .select(`
          *,
          partner:partners(
            id,
            first_name,
            last_name,
            email,
            organization:organizations(
              name,
              tier,
              type
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setDeals(dealsData || [])
    } catch (error) {
      console.error('Error loading deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPartners = async () => {
    try {
      const { data: partnersData } = await supabase
        .from('partners')
        .select(`
          id,
          first_name,
          last_name,
          organization:organizations(name)
        `)
        .order('first_name', { ascending: true })

      setPartners(partnersData || [])
    } catch (error) {
      console.error('Error loading partners:', error)
    }
  }

  const filterAndSortDeals = () => {
    let filtered = [...deals]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stage === stageFilter)
    }

    // Apply partner filter
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(deal => deal.partner_id === partnerFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'deal_value') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredDeals(filtered)
  }

  const getStageColor = (stage) => {
    const stageConfig = stages.find(s => s.value === stage)
    return stageConfig ? stageConfig.color : 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const calculateStats = () => {
    const totalDeals = filteredDeals.length
    const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)
    const wonDeals = filteredDeals.filter(deal => deal.stage === 'closed_won').length
    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

    return { totalDeals, totalValue, wonDeals, winRate }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Deals</h1>
          <p className="text-gray-600 mt-1">
            View and manage all partner deals across the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  {formatCurrency(stats.totalValue)}
                </p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.wonDeals}</p>
                <p className="text-sm text-gray-600">Deals Won</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.winRate}%</p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by customer, company, partner, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    {stages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner
                  </label>
                  <select
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    <option value="all">All Partners</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.first_name} {partner.last_name} - {partner.organization?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="updated_at">Updated Date</option>
                    <option value="deal_value">Deal Value</option>
                    <option value="customer_name">Customer Name</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deals List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {deals.length === 0 ? 'No deals registered yet' : 'No deals match your filters'}
              </h3>
              <p className="text-gray-600">
                {deals.length === 0 
                  ? 'Deals will appear here as partners register them.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {deal.customer_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                          {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                          {deal.priority?.charAt(0).toUpperCase() + deal.priority?.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {deal.customer_company && (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {deal.customer_company}
                          </div>
                        )}
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(deal.deal_value)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(deal.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-1" />
                        <span>Partner: {deal.partner?.first_name} {deal.partner?.last_name}</span>
                        <span className="mx-2">•</span>
                        <span>{deal.partner?.organization?.name}</span>
                        <span className="mx-2">•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          deal.partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                          deal.partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                          deal.partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {deal.partner?.organization?.tier?.charAt(0).toUpperCase() + deal.partner?.organization?.tier?.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/deals/${deal.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}