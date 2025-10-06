// src/app/admin/deals/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, User, Mail, Building2, DollarSign, Calendar, 
  Tag, Activity, CheckCircle, Clock, AlertCircle, Phone, 
  FileText, Eye, Award, TrendingUp, BarChart3, HandshakeIcon, MessageSquare, Upload
} from 'lucide-react'

export default function AdminDealDetailsPage({ params }) {
  const [deal, setDeal] = useState(null)
  const [activities, setActivities] = useState([])
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  const stages = [
  { value: 'new_deal', label: 'New Deal', color: 'bg-gray-100 text-gray-800', icon: User },
  { value: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  { value: 'urs', label: 'URS', color: 'bg-cyan-100 text-cyan-800', icon: FileText },
  { value: 'base_deployment', label: 'Base Deployment', color: 'bg-indigo-100 text-indigo-800', icon: Upload },
  { value: 'gap_assessment', label: 'Gap Assessment', color: 'bg-pink-100 text-pink-800', icon: Activity },
  { value: 'development', label: 'Development', color: 'bg-orange-100 text-orange-800', icon: Activity },
  { value: 'uat', label: 'UAT', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
  { value: 'iq', label: 'IQ', color: 'bg-lime-100 text-lime-800', icon: CheckCircle },
  { value: 'oq', label: 'OQ', color: 'bg-amber-100 text-amber-800', icon: CheckCircle },
  { value: 'deployment', label: 'Deployment', color: 'bg-emerald-100 text-emerald-800', icon: Upload },
  { value: 'pq', label: 'PQ', color: 'bg-violet-100 text-violet-800', icon: CheckCircle },
  { value: 'live', label: 'LIVE', color: 'bg-green-200 text-green-800', icon: CheckCircle }
]

  useEffect(() => {
    if (params.id) {
      loadDealDetails()
    }
  }, [params.id])

  const loadDealDetails = async () => {
    try {
      setLoading(true)
      
      // Get deal details
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', params.id)
        .single()

      if (dealError) {
        if (dealError.code === 'PGRST116') {
          router.push('/admin/deals')
          return
        }
        throw dealError
      }

      setDeal(dealData)

      // Get partner information
      if (dealData.partner_id) {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('id, first_name, last_name, email, phone, organization_id')
          .eq('id', dealData.partner_id)
          .single()

        if (partnerData) {
          // Get organization
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', partnerData.organization_id)
            .single()

          setPartner({
            ...partnerData,
            organization: orgData
          })
        }
      }

      // Get deal activities
      const { data: activitiesData } = await supabase
        .from('deal_activities')
        .select('*')
        .eq('deal_id', params.id)
        .order('created_at', { ascending: false })

      setActivities(activitiesData || [])

    } catch (error) {
      console.error('Error loading deal details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageInfo = (stage) => {
    return stages.find(s => s.value === stage) || stages[0]
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'created': return CheckCircle
      case 'stage_updated': return Activity
      case 'note_added': return FileText
      default: return Activity
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal not found</h2>
            <p className="text-gray-600 mb-6">The deal you're looking for doesn't exist.</p>
            <Link
              href="/admin/deals"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const stageInfo = getStageInfo(deal.stage)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin/deals"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to All Deals
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{deal.customer_name}</h1>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Eye className="h-3 w-3 mr-1" />
                  View Only
                </span>
              </div>
              <p className="text-gray-600">{deal.customer_company}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stageInfo.color}`}>
                <stageInfo.icon className="h-4 w-4 mr-1" />
                {stageInfo.label}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(deal.priority)}`}>
                {deal.priority?.charAt(0).toUpperCase() + deal.priority?.slice(1)} Priority
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Progress */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Progress</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-gray-900">Current Stage</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stageInfo.color}`}>
                    {stageInfo.label}
                  </span>
                </div>

                <div className="relative">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${((stages.findIndex(s => s.value === deal.stage) + 1) / stages.length) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    {stages.slice(0, -2).map((stage, index) => (
                      <span key={stage.value} className={`${
                        stages.findIndex(s => s.value === deal.stage) >= index ? 'text-blue-600 font-medium' : ''
                      }`}>
                        {stage.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div> */}

            {/* Deal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Information</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contact</p>
                        <p className="text-sm text-gray-600">{deal.customer_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <a href={`mailto:${deal.customer_email}`} className="text-sm text-blue-600 hover:text-blue-700">
                          {deal.customer_email}
                        </a>
                      </div>
                    </div>

                    {deal.customer_phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <a href={`tel:${deal.customer_phone}`} className="text-sm text-blue-600 hover:text-blue-700">
                            {deal.customer_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Company</p>
                        <p className="text-sm text-gray-600">{deal.customer_company}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                    <HandshakeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Deal Stage</p>
                      <p className="text-sm text-gray-600">{getStageInfo(deal.stage).label}</p>
                    </div>
                  </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Deal Value</p>
                        <p className="text-sm text-gray-600">{formatCurrency(deal.deal_value)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Support Type</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {deal.support_type_needed?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created</p>
                        <p className="text-sm text-gray-600">
                          {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-600">
                          {new Date(deal.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {deal.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{deal.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <div className="text-center py-6">
                      <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No activity yet</p>
                    </div>
                  ) : (
                    activities.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.activity_type)
                      return (
                        <div key={activity.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <ActivityIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900">
                              {activity.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Statistics</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Days in Pipeline</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor((new Date() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(deal.updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Activities</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.length}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deal Value</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(deal.deal_value)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Information */}
            {partner && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Partner Information</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {partner.first_name} {partner.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{partner.organization?.name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <a href={`mailto:${partner.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {partner.email}
                      </a>
                    </div>

                    {partner.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone</span>
                        <a href={`tel:${partner.phone}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {partner.phone}
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Partner Type</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {partner.organization?.type?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier</span>
                      <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                        partner.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        partner.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        partner.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {partner.organization?.tier?.charAt(0).toUpperCase() + partner.organization?.tier?.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-gray-900">{partner.organization?.discount_percentage || 0}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={`/admin/partners/${partner.id}`}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <User className="h-4 w-4 mr-2" />
                      View Partner Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Note */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Eye className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Admin View</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>You're viewing this deal as an administrator. Partners can update the deal stage and add notes from their dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}