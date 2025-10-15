// src/app/dashboard/learning/certificates/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Award, Download, Eye, Calendar, Share2 } from 'lucide-react'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: partnerData } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (partnerData) {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            completed_at,
            certificate_url
          `)
          .eq('partner_id', partnerData.id)
          .not('completed_at', 'is', null)

        if (enrollments) {
          const enrollmentIds = enrollments.map(e => e.id)
          
          const { data: certsData } = await supabase
            .from('certificates')
            .select('*')
            .in('enrollment_id', enrollmentIds)
            .order('issued_at', { ascending: false })

          setCertificates(certsData || [])
        }
      }
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Certificates</h1>

        {certificates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600 mb-6">
              Complete courses to earn certificates
            </p>
            <Link
              href="/dashboard/learning"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-gray-900">{cert.course_title}</h3>
                    <p className="text-sm text-gray-500">Certificate #{cert.certificate_number.slice(-6)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Completed {new Date(cert.completion_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/api/certificates/${cert.certificate_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </a>
                  <a
                    href={`/api/certificates/${cert.certificate_number}`}
                    download
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}