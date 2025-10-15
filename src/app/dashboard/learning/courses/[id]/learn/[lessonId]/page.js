// src/app/dashboard/learning/courses/[id]/learn/[lessonId]/page.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle, XCircle, 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw
} from 'lucide-react'

export default function LessonPlayerPage({ params }) {
  const [lesson, setLesson] = useState(null)
  const [questions, setQuestions] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [nextLesson, setNextLesson] = useState(null)
  const [videoWatched, setVideoWatched] = useState(false)
  
  const playerRef = useRef(null)
  const progressIntervalRef = useRef(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadLessonData()
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [params.lessonId])

  const loadLessonData = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: partnerData } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!partnerData) return

      // Get lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('course_lessons')
        .select(`
          *,
          module:course_modules(
            id,
            course_id,
            order_index
          )
        `)
        .eq('id', params.lessonId)
        .single()

      if (lessonError) throw lessonError
      setLesson(lessonData)

      // Get enrollment
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('partner_id', partnerData.id)
        .eq('course_id', lessonData.module.course_id)
        .single()

      if (!enrollmentData) {
        router.push(`/dashboard/learning/courses/${params.id}`)
        return
      }
      setEnrollment(enrollmentData)

      // Get or create lesson progress
      let { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id)
        .eq('lesson_id', params.lessonId)
        .single()

      if (!progressData) {
        const { data: newProgress } = await supabase
          .from('lesson_progress')
          .insert([{
            enrollment_id: enrollmentData.id,
            lesson_id: params.lessonId,
            watch_time: 0,
            completed: false
          }])
          .select()
          .single()
        
        progressData = newProgress
      }
      
      setProgress(progressData)
      setVideoWatched(progressData.completed || progressData.watch_time >= lessonData.duration * 0.95)

      // Get quiz questions
      const { data: questionsData } = await supabase
        .from('lesson_questions')
        .select('*')
        .eq('lesson_id', params.lessonId)
        .order('order_index', { ascending: true })

      setQuestions(questionsData || [])

      // Get next lesson
      const { data: allLessons } = await supabase
        .from('course_lessons')
        .select('id, order_index, module_id')
        .eq('module_id', lessonData.module_id)
        .order('order_index', { ascending: true })

      const currentIndex = allLessons.findIndex(l => l.id === params.lessonId)
      if (currentIndex < allLessons.length - 1) {
        setNextLesson(allLessons[currentIndex + 1])
      }

    } catch (error) {
      console.error('Error loading lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (lesson && !loading) {
      loadYouTubeAPI()
    }
  }, [lesson, loading])

  const loadYouTubeAPI = () => {
    if (window.YT) {
      initializePlayer()
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = initializePlayer
  }

  const initializePlayer = () => {
    if (!lesson || playerRef.current) return

    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: lesson.video_url,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onStateChange: onPlayerStateChange
      }
    })
  }

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      startProgressTracking()
    } else if (event.data === window.YT.PlayerState.PAUSED || 
               event.data === window.YT.PlayerState.ENDED) {
      stopProgressTracking()
      
      if (event.data === window.YT.PlayerState.ENDED) {
        handleVideoComplete()
      }
    }
  }

  const startProgressTracking = () => {
    if (progressIntervalRef.current) return

    progressIntervalRef.current = setInterval(async () => {
      if (!playerRef.current || !progress || !enrollment) return

      try {
        const currentTime = Math.floor(playerRef.current.getCurrentTime())
        
        await supabase
          .from('lesson_progress')
          .update({
            watch_time: currentTime,
            last_watched_at: new Date().toISOString()
          })
          .eq('id', progress.id)

        // Check if video is 95% watched
        if (currentTime >= lesson.duration * 0.95 && !videoWatched) {
          setVideoWatched(true)
        }
      } catch (error) {
        console.error('Error updating progress:', error)
      }
    }, 10000) // Update every 10 seconds
  }

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const handleVideoComplete = () => {
    setVideoWatched(true)
    if (questions.length > 0) {
      setShowQuiz(true)
    }
  }

  const handleAnswerSelect = (questionId, answerIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answerIndex
    })
  }

  const submitQuiz = async () => {
    try {
      setQuizSubmitted(true)

      // Calculate score
      let correct = 0
      const totalQuestions = questions.length

      questions.forEach(question => {
        if (quizAnswers[question.id] === question.correct_answer) {
          correct++
        }
      })

      const score = Math.round((correct / totalQuestions) * 100)
      const passed = score >= 70

      setQuizResult({ score, passed, correct, total: totalQuestions })

      // Save quiz attempt
      await supabase
        .from('quiz_attempts')
        .insert([{
          enrollment_id: enrollment.id,
          lesson_id: lesson.id,
          answers: quizAnswers,
          score: score,
          passed: passed,
          attempt_number: 1
        }])

      // If passed, mark lesson as completed
      if (passed) {
        await supabase
          .from('lesson_progress')
          .update({ completed: true })
          .eq('id', progress.id)

        // Check if course is complete
        await checkCourseCompletion()
      }

    } catch (error) {
      console.error('Error submitting quiz:', error)
    }
  }

  const checkCourseCompletion = async () => {
    try {
      // Get all lessons in the course
      const { data: allModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', lesson.module.course_id)

      const moduleIds = allModules.map(m => m.id)

      const { data: allLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds)

      // Get completed lessons
      const { data: completedProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .eq('completed', true)

      const completedLessonIds = completedProgress.map(p => p.lesson_id)

      // Check if all lessons are completed
      const allCompleted = allLessons.every(lesson => 
        completedLessonIds.includes(lesson.id)
      )

      if (allCompleted) {
        await generateCertificate()
      }
    } catch (error) {
      console.error('Error checking course completion:', error)
    }
  }

  const generateCertificate = async () => {
    try {
      const { data: partnerData } = await supabase
        .from('partners')
        .select('first_name, last_name')
        .eq('id', enrollment.partner_id)
        .single()

      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', lesson.module.course_id)
        .single()

      const certificateNumber = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      await supabase
        .from('certificates')
        .insert([{
          enrollment_id: enrollment.id,
          certificate_number: certificateNumber,
          partner_name: `${partnerData.first_name} ${partnerData.last_name}`,
          course_title: courseData.title,
          completion_date: new Date().toISOString().split('T')[0]
        }])

      // Update enrollment
      await supabase
        .from('course_enrollments')
        .update({
          completed_at: new Date().toISOString(),
          certificate_url: `/api/certificates/${certificateNumber}`
        })
        .eq('id', enrollment.id)

    } catch (error) {
      console.error('Error generating certificate:', error)
    }
  }

  const retakeQuiz = () => {
    setQuizSubmitted(false)
    setQuizAnswers({})
    setQuizResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson not found</h2>
            <Link href="/dashboard/learning" className="text-blue-600 hover:text-blue-700">
              Back to Learning
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <Link
            href={`/dashboard/learning/courses/${params.id}`}
            className="inline-flex items-center text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Course
          </Link>
        </div>

        {!showQuiz ? (
          <div className="bg-black rounded-xl overflow-hidden">
            <div className="aspect-video">
              <div id="youtube-player" className="w-full h-full"></div>
            </div>
            
            <div className="bg-gray-800 p-6">
              <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-gray-300 mb-4">{lesson.description}</p>
              )}
              
              {videoWatched && questions.length > 0 && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Take Quiz
                </button>
              )}

              {videoWatched && questions.length === 0 && nextLesson && (
                <Link
                  href={`/dashboard/learning/courses/${params.id}/learn/${nextLesson.id}`}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Next Lesson
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Time!</h2>
            
            {!quizSubmitted ? (
              <div className="space-y-6">
                {questions.map((question, idx) => (
                  <div key={question.id} className="border-b pb-6">
                    <p className="font-medium text-gray-900 mb-4">
                      {idx + 1}. {question.question_text}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            quizAnswers[question.id] === optIdx ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={quizAnswers[question.id] === optIdx}
                            onChange={() => handleAnswerSelect(question.id, optIdx)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-3 text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < questions.length}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  quizResult.passed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {quizResult.passed ? (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {quizResult.passed ? 'Congratulations!' : 'Keep Learning!'}
                </h3>
                <p className="text-gray-600 mb-6">
                  You scored {quizResult.score}% ({quizResult.correct} out of {quizResult.total} correct)
                </p>
                
                {quizResult.passed ? (
                  <div className="space-y-4">
                    <p className="text-green-600 font-medium">
                      You passed! You can now continue to the next lesson.
                    </p>
                    {nextLesson && (
                      <Link
                        href={`/dashboard/learning/courses/${params.id}/learn/${nextLesson.id}`}
                        className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Next Lesson
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/learning/courses/${params.id}`}
                      className="block text-gray-600 hover:text-gray-900"
                    >
                      Back to Course Overview
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-600 font-medium">
                      You need 70% to pass. Please review the lesson and try again.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => {
                          setShowQuiz(false)
                          setQuizSubmitted(false)
                          setQuizAnswers({})
                          setQuizResult(null)
                        }}
                        className="inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
                      >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Review Lesson
                      </button>
                      <button
                        onClick={retakeQuiz}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-semibold text-gray-900 mb-4">Review Your Answers</h4>
                  <div className="space-y-4 text-left">
                    {questions.map((question, idx) => {
                      const userAnswer = quizAnswers[question.id]
                      const isCorrect = userAnswer === question.correct_answer
                      
                      return (
                        <div key={question.id} className={`p-4 rounded-lg ${
                          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-start">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 mb-2">
                                {idx + 1}. {question.question_text}
                              </p>
                              <p className="text-sm text-gray-700">
                                Your answer: <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                  {question.options[userAnswer]}
                                </span>
                              </p>
                              {!isCorrect && (
                                <p className="text-sm text-green-700 mt-1">
                                  Correct answer: <span className="font-medium">{question.options[question.correct_answer]}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}