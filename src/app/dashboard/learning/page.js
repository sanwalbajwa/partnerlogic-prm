// src/app/dashboard/learning/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, BookOpen, Video, Award, Clock, Play,
  CheckCircle, TrendingUp, Filter, ChevronDown, GraduationCap
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
      if (!user) {
        setLoading(false)
        return
      }

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
          .order('enrolled_at', { ascending: false })

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

  const filteredAvailableCourses = availableCourses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const notEnrolled = !isEnrolled(course.id)
    
    return matchesSearch && notEnrolled
  })

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Learning Center</h1>
          <p className="text-gray-600">Enhance your skills and grow your business with our training programs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
                <p className="text-sm text-gray-600">Enrolled Courses</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {enrolledCourses.filter(e => e.completed_at).length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {enrolledCourses.filter(e => e.certificate_url).length}
                </p>
                <p className="text-sm text-gray-600">Certificates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
              <Link 
                href="/dashboard/learning/certificates"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Certificates →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enrolledCourses.map(enrollment => (
                <Link
                  key={enrollment.id}
                  href={`/dashboard/learning/courses/${enrollment.course_id}`}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
                >
                  {enrollment.course.thumbnail_url && (
                    <img 
                      src={enrollment.course.thumbnail_url} 
                      alt={enrollment.course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{enrollment.course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {enrollment.course.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{enrollment.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                    {enrollment.completed_at ? (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </div>
                    ) : (
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        <Play className="h-4 w-4 mr-1" />
                        Continue Learning
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-black leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Available Courses */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {filteredAvailableCourses.length > 0 ? 'Available Courses' : 'No Available Courses'}
          </h2>
          
          {filteredAvailableCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {availableCourses.length === 0 
                  ? 'No courses available yet' 
                  : enrolledCourses.length === availableCourses.length
                  ? 'All courses enrolled!'
                  : 'No courses match your search'}
              </h3>
              <p className="text-gray-600">
                {availableCourses.length === 0 
                  ? 'Check back soon for new training content.' 
                  : enrolledCourses.length === availableCourses.length
                  ? 'You have enrolled in all available courses.'
                  : 'Try adjusting your search term.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredAvailableCourses.map(course => (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                  {course.thumbnail_url && (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                    
                    {course.instructor_name && (
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <Video className="h-4 w-4 mr-1" />
                        <span>by {course.instructor_name}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => enroll(course.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Enroll Now
                    </button>
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