// src/app/admin/lms/new/page.js
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, AlertTriangle, CheckCircle, Plus, Trash2,
  Video, GripVertical
} from 'lucide-react'

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
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

  const [modules, setModules] = useState([
    {
      id: 'temp-1',
      title: '',
      description: '',
      lessons: []
    }
  ])

  const router = useRouter()
  const supabase = createClient()

  const categories = [
    { value: 'technical', label: 'Technical Training' },
    { value: 'sales', label: 'Sales Enablement' },
    { value: 'product', label: 'Product Knowledge' },
    { value: 'onboarding', label: 'Partner Onboarding' },
    { value: 'certification', label: 'Certification Programs' }
  ]

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (5MB max)
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
      lessons: []
    }])
  }

  const removeModule = (moduleId) => {
    if (modules.length === 1) {
      alert('You must have at least one module')
      return
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
            questions: [
              { question_text: '', options: ['', '', '', ''], correct_answer: 0 }
            ]
          }]
        }
      }
      return m
    }))
  }

  const removeLesson = (moduleId, lessonId) => {
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
                questions: [...l.questions, { question_text: '', options: ['', '', '', ''], correct_answer: 0 }]
              }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const removeQuestion = (moduleId, lessonId, questionIndex) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              return {
                ...l,
                questions: l.questions.filter((_, idx) => idx !== questionIndex)
              }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const updateQuestion = (moduleId, lessonId, questionIndex, field, value) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              const newQuestions = [...l.questions]
              newQuestions[questionIndex] = {
                ...newQuestions[questionIndex],
                [field]: value
              }
              return { ...l, questions: newQuestions }
            }
            return l
          })
        }
      }
      return m
    }))
  }

  const updateQuestionOption = (moduleId, lessonId, questionIndex, optionIndex, value) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              const newQuestions = [...l.questions]
              const newOptions = [...newQuestions[questionIndex].options]
              newOptions[optionIndex] = value
              newQuestions[questionIndex] = {
                ...newQuestions[questionIndex],
                options: newOptions
              }
              return { ...l, questions: newQuestions }
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
          
          // Validate questions only if they have content
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
      setLoading(true)

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert([{
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnail_url: formData.thumbnail_url.trim() || null,
          category: formData.category,
          instructor_name: formData.instructor_name.trim() || null,
          instructor_bio: formData.instructor_bio.trim() || null,
          published: formData.published,
          total_duration: 0
        }])
        .select()
        .single()

      if (courseError) throw courseError

      for (let i = 0; i < modules.length; i++) {
        const module = modules[i]
        
        const { data: moduleData, error: moduleError } = await supabase
          .from('course_modules')
          .insert([{
            course_id: courseData.id,
            title: module.title.trim(),
            description: module.description.trim() || null,
            order_index: i
          }])
          .select()
          .single()

        if (moduleError) throw moduleError

        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j]
          const videoId = extractYouTubeId(lesson.video_url)
          
          const { data: lessonData, error: lessonError } = await supabase
            .from('course_lessons')
            .insert([{
              module_id: moduleData.id,
              title: lesson.title.trim(),
              description: lesson.description.trim() || null,
              video_url: videoId,
              duration: parseInt(lesson.duration),
              order_index: j
            }])
            .select()
            .single()

          if (lessonError) throw lessonError

          // Create questions for this lesson (only if they have content)
          const validQuestions = lesson.questions.filter(q => 
            q.question_text.trim() && q.options.every(opt => opt.trim())
          )
          
          for (let k = 0; k < validQuestions.length; k++) {
            const question = validQuestions[k]
            
            const { error: questionError } = await supabase
              .from('lesson_questions')
              .insert([{
                lesson_id: lessonData.id,
                question_text: question.question_text.trim(),
                options: question.options,
                correct_answer: parseInt(question.correct_answer),
                order_index: k
              }])

            if (questionError) throw questionError
          }
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/lms')
      }, 2000)

    } catch (error) {
      console.error('Error creating course:', error)
      setErrors({ submit: error.message || 'Failed to create course. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Created!</h2>
            <p className="text-gray-600 mb-6">
              Your course has been created successfully. Redirecting...
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
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create New Course</h1>
          <p className="text-gray-600 mt-1">Add course details, modules, lessons, and quiz questions</p>
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
                  <span className="text-sm font-medium text-gray-700">Publish course immediately</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modules */}
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

            {errors.modules && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.modules}
              </div>
            )}

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
                        className={`block w-full px-3 py-2 text-black border rounded-lg ${errors[`module_${moduleIdx}_title`] ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="e.g., Introduction to Sales Process"
                      />
                      {errors[`module_${moduleIdx}_title`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`module_${moduleIdx}_title`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Module Description</label>
                      <textarea
                        value={module.description}
                        onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                        rows={2}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                        placeholder="Brief description of this module..."
                      />
                    </div>

                    {/* Lessons */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">Lessons</h4>
                        <button
                          type="button"
                          onClick={() => addLesson(module.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Lesson
                        </button>
                      </div>

                      {errors[`module_${moduleIdx}_lessons`] && (
                        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                          {errors[`module_${moduleIdx}_lessons`]}
                        </div>
                      )}

                      {module.lessons.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No lessons added yet</p>
                      ) : (
                        <div className="space-y-4">
                          {module.lessons.map((lesson, lessonIdx) => (
                            <div key={lesson.id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-medium text-gray-900">Lesson {lessonIdx + 1}</h5>
                                <button
                                  type="button"
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Lesson Title *</label>
                                  <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                    className={`block w-full px-2 py-1.5 text-sm text-black border rounded ${errors[`lesson_${moduleIdx}_${lessonIdx}_title`] ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="e.g., Understanding Customer Needs"
                                  />
                                  {errors[`lesson_${moduleIdx}_${lessonIdx}_title`] && (
                                    <p className="mt-1 text-xs text-red-600">{errors[`lesson_${moduleIdx}_${lessonIdx}_title`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">YouTube Video URL or ID *</label>
                                  <input
                                    type="text"
                                    value={lesson.video_url}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'video_url', e.target.value)}
                                    className={`block w-full px-2 py-1.5 text-sm text-black border rounded ${errors[`lesson_${moduleIdx}_${lessonIdx}_video`] ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="https://youtube.com/watch?v=... or video ID"
                                  />
                                  {errors[`lesson_${moduleIdx}_${lessonIdx}_video`] && (
                                    <p className="mt-1 text-xs text-red-600">{errors[`lesson_${moduleIdx}_${lessonIdx}_video`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (seconds) *</label>
                                  <input
                                    type="number"
                                    value={lesson.duration}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'duration', e.target.value)}
                                    className={`block w-full px-2 py-1.5 text-sm text-black border rounded ${errors[`lesson_${moduleIdx}_${lessonIdx}_duration`] ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="300"
                                    min="1"
                                  />
                                  {errors[`lesson_${moduleIdx}_${lessonIdx}_duration`] && (
                                    <p className="mt-1 text-xs text-red-600">{errors[`lesson_${moduleIdx}_${lessonIdx}_duration`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                  <textarea
                                    value={lesson.description}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'description', e.target.value)}
                                    rows={2}
                                    className="block w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded"
                                    placeholder="Brief description..."
                                  />
                                </div>

                                {/* Quiz Questions */}
                                <div className="pt-3 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="text-xs font-semibold text-gray-900">Quiz Questions</h6>
                                    <button
                                      type="button"
                                      onClick={() => addQuestion(module.id, lesson.id)}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Question
                                    </button>
                                  </div>
                                  
                                  {lesson.questions.length === 0 ? (
                                    <div className="text-center py-3 bg-gray-50 rounded border border-dashed border-gray-300">
                                      <p className="text-xs text-gray-500">No quiz for this lesson</p>
                                      <p className="text-xs text-gray-400 mt-1">Click "Add Question" to create quiz</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {lesson.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                          <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium text-gray-700">
                                              Question {qIdx + 1}
                                            </label>
                                            <button
                                              type="button"
                                              onClick={() => removeQuestion(module.id, lesson.id, qIdx)}
                                              className="text-red-600 hover:text-red-700"
                                              title="Remove question"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                          
                                          <input
                                            type="text"
                                            value={q.question_text}
                                            onChange={(e) => updateQuestion(module.id, lesson.id, qIdx, 'question_text', e.target.value)}
                                            placeholder="Enter question text..."
                                            className="block w-full px-2 py-1.5 text-xs text-black border border-gray-300 rounded mb-2"
                                          />
                                          {errors[`question_${moduleIdx}_${lessonIdx}_${qIdx}`] && (
                                            <p className="text-xs text-red-600 mb-2">{errors[`question_${moduleIdx}_${lessonIdx}_${qIdx}`]}</p>
                                          )}
                                          
                                          <div className="space-y-1.5">
                                            <p className="text-xs text-gray-600 mb-1">Options (select correct answer):</p>
                                            {q.options.map((option, optIdx) => (
                                              <div key={optIdx} className="flex items-center space-x-2">
                                                <input
                                                  type="radio"
                                                  name={`correct-${moduleIdx}-${lessonIdx}-${qIdx}`}
                                                  checked={q.correct_answer === optIdx}
                                                  onChange={() => updateQuestion(module.id, lesson.id, qIdx, 'correct_answer', optIdx)}
                                                  className="w-3 h-3 text-green-600 focus:ring-green-500"
                                                  title="Mark as correct answer"
                                                />
                                                <input
                                                  type="text"
                                                  value={option}
                                                  onChange={(e) => updateQuestionOption(module.id, lesson.id, qIdx, optIdx, e.target.value)}
                                                  placeholder={`Option ${optIdx + 1}`}
                                                  className="flex-1 px-2 py-1 text-xs text-black border border-gray-300 rounded"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                          {errors[`question_${moduleIdx}_${lessonIdx}_${qIdx}_options`] && (
                                            <p className="text-xs text-red-600 mt-1">{errors[`question_${moduleIdx}_${lessonIdx}_${qIdx}_options`]}</p>
                                          )}
                                          <p className="text-xs text-gray-500 mt-2">
                                            Select the radio button next to the correct answer
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
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
              disabled={loading || uploadingThumbnail}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Course...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}