// src/app/dashboard/learning/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, BookOpen, Video, Award, Clock, Play,
  CheckCircle, TrendingUp, Filter, ChevronDown
} from 'lucide-react'

export default function LearningDashboardPage() {
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [partner, setPartner] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: partnerData } = await supabase
        .from('partners')
        .select('id, first_name, last_name')
        .eq('auth_user_id', user.id)
        .single()

      if (partnerData) {
        setPartner(partnerData)

        // Get enrolled courses
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            course:courses(*)
          `)
          .eq('partner_id', partnerData.id)

        setEnrolledCourses(enrollments || [])

        // Get all available courses
        const { data: allCourses } = await supabase
          .from('courses')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })

        setAvailableCourses(allCourses || [])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const enroll = async (courseId) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          partner_id: partner.id,
          course_id: courseId
        }])

      if (error) throw error

      await loadCourses()
    } catch (error) {
      console.error('Error enrolling:', error)
    }
  }

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(e => e.course_id === courseId)
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Learning</h1>

        {/* Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enrolledCourses.map(enrollment => (
                <Link
                  key={enrollment.id}
                  href={`/dashboard/learning/courses/${enrollment.course_id}`}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{enrollment.course.title}</h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${enrollment.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                  {enrollment.completed_at ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed
                    </div>
                  ) : (
                    <div className="text-blue-600 text-sm">Continue →</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableCourses
              .filter(course => !isEnrolled(course.id))
              .map(course => (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  <button
                    onClick={() => enroll(course.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Enroll Now
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}