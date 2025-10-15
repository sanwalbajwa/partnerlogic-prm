// src/app/admin/lms/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Eye, Edit2, Trash2, Plus, Video,
  ChevronDown, Calendar, Users, BookOpen, Play,
  Award, TrendingUp, BarChart3, CheckCircle
} from 'lucide-react'

export default function AdminLMSPage() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const supabase = createClient()

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technical', label: 'Technical Training' },
    { value: 'sales', label: 'Sales Enablement' },
    { value: 'product', label: 'Product Knowledge' },
    { value: 'onboarding', label: 'Partner Onboarding' },
    { value: 'certification', label: 'Certification Programs' }
  ]

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder])

  const loadCourses = async () => {
    try {
      setLoading(true)
      
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:course_modules(count),
          enrollments:course_enrollments(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process the data to get counts
      const processedCourses = coursesData.map(course => ({
        ...course,
        moduleCount: course.modules[0]?.count || 0,
        enrollmentCount: course.enrollments[0]?.count || 0
      }))

      setCourses(processedCourses)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    let filtered = [...courses]

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter)
    }

    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published'
      filtered = filtered.filter(course => course.published === isPublished)
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredCourses(filtered)
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? This will delete all modules, lessons, and enrollments. This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(courseId)
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const togglePublished = async (courseId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ published: !currentStatus })
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.map(c => 
        c.id === courseId ? { ...c, published: !currentStatus } : c
      ))
    } catch (error) {
      console.error('Error updating course status:', error)
      alert('Failed to update course status.')
    }
  }

  const calculateStats = () => {
    const totalCourses = filteredCourses.length
    const publishedCourses = filteredCourses.filter(c => c.published).length
    const totalEnrollments = filteredCourses.reduce((sum, c) => sum + c.enrollmentCount, 0)
    const totalModules = filteredCourses.reduce((sum, c) => sum + c.moduleCount, 0)

    return { totalCourses, publishedCourses, totalEnrollments, totalModules }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Management System</h1>
              <p className="text-gray-600 mt-1">
                Manage courses, modules, and partner learning
              </p>
            </div>
            <Link
              href="/admin/lms/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                <p className="text-sm text-gray-600">Total Courses</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.publishedCourses}</p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
                <p className="text-sm text-gray-600">Enrollments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Video className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalModules}</p>
                <p className="text-sm text-gray-600">Total Modules</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search courses by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
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
                    <option value="title">Title</option>
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

        {/* Courses List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {courses.length === 0 ? 'No courses created yet' : 'No courses match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {courses.length === 0 
                  ? 'Create your first course to get started with the LMS.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {courses.length === 0 && (
                <Link
                  href="/admin/lms/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Course
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {course.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.published ? 'Published' : 'Draft'}
                          </span>
                          {course.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {course.category}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {course.description || 'No description provided'}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-1" />
                            {course.moduleCount} Modules
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrollmentCount} Enrolled
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(course.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => togglePublished(course.id, course.published)}
                        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          course.published
                            ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {course.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        href={`/admin/lms/${course.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deleting === course.id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {deleting === course.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
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