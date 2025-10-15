// src/app/admin/lms/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, AlertTriangle, CheckCircle, Plus, Trash2,
  Video, GripVertical, Loader2
} from 'lucide-react'

export default function EditCoursePage({ params }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    category: 'technical',
    instructor_name: '',
    instructor_bio: '',
    published: false
  })

  const [modules, setModules] = useState([])
  const [deletedModuleIds, setDeletedModuleIds] = useState([])
  const [deletedLessonIds, setDeletedLessonIds] = useState([])
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([])

  const router = useRouter()
  const supabase = createClient()

  const categories = [
    { value: 'technical', label: 'Technical Training' },
    { value: 'sales', label: 'Sales Enablement' },
    { value: 'product', label: 'Product Knowledge' },
    { value: 'onboarding', label: 'Partner Onboarding' },
    { value: 'certification', label: 'Certification Programs' }
  ]

  useEffect(() => {
    if (params.id) {
      loadCourse()
    }
  }, [params.id])

  const loadCourse = async () => {
    try {
      setLoading(true)

      // Get course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (courseError) throw courseError

      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        thumbnail_url: courseData.thumbnail_url || '',
        category: courseData.category || 'technical',
        instructor_name: courseData.instructor_name || '',
        instructor_bio: courseData.instructor_bio || '',
        published: courseData.published || false
      })

      // Get modules with lessons and questions
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', params.id)
        .order('order_index', { ascending: true })

      if (modulesError) throw modulesError

      // Get lessons for each module
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          const { data: lessonsData } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('order_index', { ascending: true })

          // Get questions for each lesson
          const lessonsWithQuestions = await Promise.all(
            (lessonsData || []).map(async (lesson) => {
              const { data: questionsData } = await supabase
                .from('lesson_questions')
                .select('*')
                .eq('lesson_id', lesson.id)
                .order('order_index', { ascending: true })

              return {
                ...lesson,
                questions: questionsData || []
              }
            })
          )

          return {
            ...module,
            lessons: lessonsWithQuestions
          }
        })
      )

      setModules(modulesWithLessons)
    } catch (error) {
      console.error('Error loading course:', error)
      alert('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      setUploadingThumbnail(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `course-thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      alert('Failed to upload thumbnail. Please try again.')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const addModule = () => {
    setModules([...modules, {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      order_index: modules.length,
      lessons: [],
      isNew: true
    }])
  }

  const removeModule = (moduleId) => {
    if (modules.length === 1) {
      alert('You must have at least one module')
      return
    }

    const module = modules.find(m => m.id === moduleId)
    if (!module.isNew) {
      setDeletedModuleIds([...deletedModuleIds, moduleId])
    }
    setModules(modules.filter(m => m.id !== moduleId))
  }

  const updateModule = (moduleId, field, value) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, [field]: value } : m
    ))
  }

  const addLesson = (moduleId) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: [...m.lessons, {
            id: `temp-lesson-${Date.now()}`,
            title: '',
            description: '',
            video_url: '',
            duration: 0,
            order_index: m.lessons.length,
            questions: [
              { id: `temp-q-${Date.now()}`, question_text: '', options: ['', '', '', ''], correct_answer: 0, isNew: true }
            ],
            isNew: true
          }]
        }
      }
      return m
    }))
  }

  const removeLesson = (moduleId, lessonId) => {
    const module = modules.find(m => m.id === moduleId)
    const lesson = module?.lessons.find(l => l.id === lessonId)
    
    if (!lesson.isNew) {
      setDeletedLessonIds([...deletedLessonIds, lessonId])
    }

    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.filter(l => l.id !== lessonId)
        }
      }
      return m
    }))
  }

  const updateLesson = (moduleId, lessonId, field, value) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { ...l, [field]: value } : l
          )
        }
      }
      return m
    }))
  }

  const addQuestion = (moduleId, lessonId) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              return {
                ...l,
                questions: [...l.questions, { 
                  id: `temp-q-${Date.now()}`,
                  question_text: '', 
                  options: ['', '', '', ''], 
                  correct_answer: 0,
                  order_index: l.questions.length,
                  isNew: true
                }]
              }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const removeQuestion = (moduleId, lessonId, questionId) => {
    const module = modules.find(m => m.id === moduleId)
    const lesson = module?.lessons.find(l => l.id === lessonId)
    const question = lesson?.questions.find(q => q.id === questionId)
    
    if (question && !question.isNew) {
      setDeletedQuestionIds([...deletedQuestionIds, questionId])
    }

    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              return {
                ...l,
                questions: l.questions.filter(q => q.id !== questionId)
              }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const updateQuestion = (moduleId, lessonId, questionId, field, value) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              return {
                ...l,
                questions: l.questions.map(q =>
                  q.id === questionId ? { ...q, [field]: value } : q
                )
              }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const updateQuestionOption = (moduleId, lessonId, questionId, optionIndex, value) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              return {
                ...l,
                questions: l.questions.map(q => {
                  if (q.id === questionId) {
                    const newOptions = [...q.options]
                    newOptions[optionIndex] = value
                    return { ...q, options: newOptions }
                  }
                  return q
                })
              }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : url
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'Course title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    
    if (modules.length === 0) {
      newErrors.modules = 'At least one module is required'
    } else {
      modules.forEach((module, idx) => {
        if (!module.title.trim()) {
          newErrors[`module_${idx}_title`] = 'Module title is required'
        }
        if (module.lessons.length === 0) {
          newErrors[`module_${idx}_lessons`] = 'At least one lesson is required'
        }
        
        module.lessons.forEach((lesson, lessonIdx) => {
          if (!lesson.title.trim()) {
            newErrors[`lesson_${idx}_${lessonIdx}_title`] = 'Lesson title is required'
          }
          if (!lesson.video_url.trim()) {
            newErrors[`lesson_${idx}_${lessonIdx}_video`] = 'Video URL is required'
          }
          if (!lesson.duration || lesson.duration <= 0) {
            newErrors[`lesson_${idx}_${lessonIdx}_duration`] = 'Duration is required'
          }
          
          lesson.questions.forEach((q, qIdx) => {
            if (q.question_text.trim() || q.options.some(opt => opt.trim())) {
              if (!q.question_text.trim()) {
                newErrors[`question_${idx}_${lessonIdx}_${qIdx}`] = 'Question text is required'
              }
              if (q.options.some(opt => !opt.trim())) {
                newErrors[`question_${idx}_${lessonIdx}_${qIdx}_options`] = 'All options are required'
              }
            }
          })
        })
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Please fix all errors before submitting')
      return
    }

    try {
      setSaving(true)

      // Update course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnail_url: formData.thumbnail_url.trim() || null,
          category: formData.category,
          instructor_name: formData.instructor_name.trim() || null,
          instructor_bio: formData.instructor_bio.trim() || null,
          published: formData.published,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (courseError) throw courseError

      // Delete removed items
      if (deletedModuleIds.length > 0) {
        await supabase.from('course_modules').delete().in('id', deletedModuleIds)
      }
      if (deletedLessonIds.length > 0) {
        await supabase.from('course_lessons').delete().in('id', deletedLessonIds)
      }
      if (deletedQuestionIds.length > 0) {
        await supabase.from('lesson_questions').delete().in('id', deletedQuestionIds)
      }

      // Update/Create modules
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i]
        let moduleId = module.id

        if (module.isNew) {
          const { data: newModule, error: moduleError } = await supabase
            .from('course_modules')
            .insert([{
              course_id: params.id,
              title: module.title.trim(),
              description: module.description.trim() || null,
              order_index: i
            }])
            .select()
            .single()

          if (moduleError) throw moduleError
          moduleId = newModule.id
        } else {
          const { error: moduleError } = await supabase
            .from('course_modules')
            .update({
              title: module.title.trim(),
              description: module.description.trim() || null,
              order_index: i
            })
            .eq('id', moduleId)

          if (moduleError) throw moduleError
        }

        // Update/Create lessons
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j]
          const videoId = extractYouTubeId(lesson.video_url)
          let lessonId = lesson.id

          if (lesson.isNew) {
            const { data: newLesson, error: lessonError } = await supabase
              .from('course_lessons')
              .insert([{
                module_id: moduleId,
                title: lesson.title.trim(),
                description: lesson.description.trim() || null,
                video_url: videoId,
                duration: parseInt(lesson.duration),
                order_index: j
              }])
              .select()
              .single()

            if (lessonError) throw lessonError
            lessonId = newLesson.id
          } else {
            const { error: lessonError } = await supabase
              .from('course_lessons')
              .update({
                title: lesson.title.trim(),
                description: lesson.description.trim() || null,
                video_url: videoId,
                duration: parseInt(lesson.duration),
                order_index: j
              })
              .eq('id', lessonId)

            if (lessonError) throw lessonError
          }

          // Update/Create questions
          const validQuestions = lesson.questions.filter(q => 
            q.question_text.trim() && q.options.every(opt => opt.trim())
          )

          for (let k = 0; k < validQuestions.length; k++) {
            const question = validQuestions[k]

            if (question.isNew) {
              const { error: questionError } = await supabase
                .from('lesson_questions')
                .insert([{
                  lesson_id: lessonId,
                  question_text: question.question_text.trim(),
                  options: question.options,
                  correct_answer: parseInt(question.correct_answer),
                  order_index: k
                }])

              if (questionError) throw questionError
            } else {
              const { error: questionError } = await supabase
                .from('lesson_questions')
                .update({
                  question_text: question.question_text.trim(),
                  options: question.options,
                  correct_answer: parseInt(question.correct_answer),
                  order_index: k
                })
                .eq('id', question.id)

              if (questionError) throw questionError
            }
          }
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/lms')
      }, 2000)

    } catch (error) {
      console.error('Error updating course:', error)
      setErrors({ submit: error.message || 'Failed to update course. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Updated!</h2>
            <p className="text-gray-600 mb-6">
              Your changes have been saved successfully. Redirecting...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/lms" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Edit Course</h1>
          <p className="text-gray-600 mt-1">Update course details, modules, lessons, and quiz questions</p>
        </div>

        <div className="space-y-8">
          {/* Course Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Course Information</h2>
            
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 text-black border rounded-lg ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., Advanced Sales Techniques"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`block w-full px-3 py-2 text-black border rounded-lg ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Describe what partners will learn in this course..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Thumbnail</label>
                <div className="flex items-start space-x-4">
                  {formData.thumbnail_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={formData.thumbnail_url} 
                        alt="Thumbnail preview" 
                        className="w-40 h-24 object-cover rounded-lg border border-gray-300" 
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumbnail}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {uploadingThumbnail ? 'Uploading...' : 'Upload an image (JPG, PNG, max 5MB)'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor Name</label>
                <input
                  type="text"
                  name="instructor_name"
                  value={formData.instructor_name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor Bio</label>
                <input
                  type="text"
                  name="instructor_bio"
                  value={formData.instructor_bio}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  placeholder="Senior Sales Trainer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modules - Same structure as create, but with existing data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Course Modules</h2>
              <button
                type="button"
                onClick={addModule}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Module
              </button>
            </div>

            <div className="space-y-6">
              {modules.map((module, moduleIdx) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">Module {moduleIdx + 1}</h3>
                    </div>
                    {modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModule(module.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Module Title *</label>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={module.description || ''}
                        onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                        rows={2}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Lessons */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold">Lessons</h4>
                        <button
                          type="button"
                          onClick={() => addLesson(module.id)}
                          className="px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100"
                        >
                          <Plus className="h-3 w-3 inline mr-1" />
                          Add Lesson
                        </button>
                      </div>

                      {module.lessons.map((lesson, lessonIdx) => (
                        <div key={lesson.id} className="bg-white border rounded-lg p-4 mb-4">
                          <div className="flex justify-between mb-3">
                            <h5 className="text-sm font-medium">Lesson {lessonIdx + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeLesson(module.id, lesson.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                              placeholder="Lesson title"
                              className="block w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              value={lesson.video_url}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'video_url', e.target.value)}
                              placeholder="YouTube URL or ID"
                              className="block w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              value={lesson.duration}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'duration', e.target.value)}
                              placeholder="Duration (seconds)"
                              className="block w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded"
                            />
                            <textarea
                              value={lesson.description || ''}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'description', e.target.value)}
                              placeholder="Description"
                              rows={2}
                              className="block w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded"
                            />

                            {/* Quiz Questions */}
                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-xs font-semibold">Quiz Questions</h6>
                                <button
                                  type="button"
                                  onClick={() => addQuestion(module.id, lesson.id)}
                                  className="px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-100"
                                >
                                  <Plus className="h-3 w-3 inline mr-1" />
                                  Add Question
                                </button>
                              </div>
                              
                              {lesson.questions.length === 0 ? (
                                <div className="text-center py-3 bg-gray-50 rounded border border-dashed">
                                  <p className="text-xs text-gray-500">No quiz for this lesson</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {lesson.questions.map((q, qIdx) => (
                                    <div key={q.id} className="bg-gray-50 rounded-lg p-3 border">
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-gray-700">
                                          Question {qIdx + 1}
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => removeQuestion(module.id, lesson.id, q.id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                      
                                      <input
                                        type="text"
                                        value={q.question_text}
                                        onChange={(e) => updateQuestion(module.id, lesson.id, q.id, 'question_text', e.target.value)}
                                        placeholder="Enter question..."
                                        className="block w-full px-2 py-1.5 text-xs text-black border rounded mb-2"
                                      />
                                      
                                      <div className="space-y-1.5">
                                        <p className="text-xs text-gray-600 mb-1">Options:</p>
                                        {q.options.map((option, optIdx) => (
                                          <div key={optIdx} className="flex items-center space-x-2">
                                            <input
                                              type="radio"
                                              name={`correct-${module.id}-${lesson.id}-${q.id}`}
                                              checked={q.correct_answer === optIdx}
                                              onChange={() => updateQuestion(module.id, lesson.id, q.id, 'correct_answer', optIdx)}
                                              className="w-3 h-3"
                                            />
                                            <input
                                              type="text"
                                              value={option}
                                              onChange={(e) => updateQuestionOption(module.id, lesson.id, q.id, optIdx, e.target.value)}
                                              placeholder={`Option ${optIdx + 1}`}
                                              className="flex-1 px-2 py-1 text-xs text-black border rounded"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Link
              href="/admin/lms"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving || uploadingThumbnail}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}