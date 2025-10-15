// src/app/dashboard/learning/courses/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Play, Clock, Video, CheckCircle, Lock,
  Award, User, BookOpen
} from 'lucide-react'

export default function CourseOverviewPage({ params }) {
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadCourseData()
    }
  }, [params.id])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: partnerData } = await supabase
        .from('partners')
        .select('id, first_name, last_name')
        .eq('auth_user_id', user.id)
        .single()

      if (partnerData) {
        setPartner(partnerData)

        // Get course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', params.id)
          .single()

        if (courseError) throw courseError
        setCourse(courseData)

        // Get modules with lessons
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            *,
            lessons:course_lessons(*)
          `)
          .eq('course_id', params.id)
          .order('order_index', { ascending: true })

        if (modulesError) throw modulesError
        
        // Sort lessons within each module
        const sortedModules = modulesData.map(module => ({
          ...module,
          lessons: module.lessons.sort((a, b) => a.order_index - b.order_index)
        }))
        
        setModules(sortedModules)

        // Get enrollment
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('partner_id', partnerData.id)
          .eq('course_id', params.id)
          .single()

        if (enrollmentData) {
          setEnrollment(enrollmentData)

          // Get lesson progress
          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('enrollment_id', enrollmentData.id)

          setProgress(progressData || [])
        }
      }
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoading(false)
    }
  }

  const enrollInCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([{
          partner_id: partner.id,
          course_id: params.id
        }])
        .select()
        .single()

      if (error) throw error

      setEnrollment(data)
    } catch (error) {
      console.error('Error enrolling:', error)
    }
  }

  const isLessonCompleted = (lessonId) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed)
  }

  const getFirstIncompleteLesson = () => {
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (!isLessonCompleted(lesson.id)) {
          return lesson.id
        }
      }
    }
    return modules[0]?.lessons[0]?.id
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
            <Link href="/dashboard/learning" className="text-blue-600 hover:text-blue-700">
              Back to Learning
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/learning" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Learning
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-64 object-cover rounded-lg mb-6" />
              )}
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6">{course.description}</p>

              {course.instructor_name && (
                <div className="flex items-center mb-6 pb-6 border-b">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">{course.instructor_name}</div>
                    {course.instructor_bio && (
                      <div className="text-sm text-gray-600">{course.instructor_bio}</div>
                    )}
                  </div>
                </div>
              )}

              {enrollment ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm font-medium">{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={enrollInCourse}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Enroll in Course
                </button>
              )}

              {enrollment && (
                <Link
                  href={`/dashboard/learning/courses/${params.id}/learn/${getFirstIncompleteLesson()}`}
                  className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center font-semibold"
                >
                  {enrollment.progress_percentage > 0 ? 'Continue Learning' : 'Start Course'}
                </Link>
              )}
            </div>

            {/* Course Curriculum */}
            <div className="bg-white rounded-xl shadow-sm border p-8 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
              
              <div className="space-y-6">
                {modules.map((module, moduleIdx) => (
                  <div key={module.id} className="border rounded-lg">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-semibold text-gray-900">
                        Module {moduleIdx + 1}: {module.title}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      )}
                    </div>
                    
                    <div className="divide-y">
                      {module.lessons.map((lesson, lessonIdx) => {
                        const completed = isLessonCompleted(lesson.id)
                        const canAccess = enrollment && (lessonIdx === 0 || isLessonCompleted(module.lessons[lessonIdx - 1]?.id))
                        
                        return (
                          <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                completed ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                {completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : canAccess ? (
                                  <Play className="h-5 w-5 text-gray-600" />
                                ) : (
                                  <Lock className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{lesson.title}</div>
                                {lesson.description && (
                                  <div className="text-sm text-gray-600">{lesson.description}</div>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDuration(lesson.duration)}
                              </div>
                            </div>
                            
                            {enrollment && canAccess && (
                              <Link
                                href={`/dashboard/learning/courses/${params.id}/learn/${lesson.id}`}
                                className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                {completed ? 'Review' : 'Start'}
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{modules.length} Modules</span>
                </div>
                <div className="flex items-center">
                  <Video className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">
                    {modules.reduce((sum, m) => sum + m.lessons.length, 0)} Lessons
                  </span>
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Certificate on completion</span>
                </div>
              </div>
            </div>

            {enrollment?.completed_at && enrollment.certificate_url && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-6">
                <div className="flex items-center mb-4">
                  <Award className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Certificate Earned!</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Congratulations on completing this course!
                </p>
                <a
                  href={enrollment.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                >
                  Download Certificate
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}