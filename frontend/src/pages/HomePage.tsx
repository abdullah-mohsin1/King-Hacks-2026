import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { coursesApi, Course } from '../api/client';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesApi.create(courseCode, courseTitle);
      setCourseCode('');
      setCourseTitle('');
      setShowCreateForm(false);
      loadCourses();
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert('Course already exists!');
      } else {
        alert('Failed to create course');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-950"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-navy-950 mb-4">
          Welcome to Lecture Library
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your lecture recordings and transform them into comprehensive study materials:
          transcripts, notes, flashcards, quizzes, and podcast recaps.
        </p>
      </div>

      {/* Create Course Section */}
      <div className="mb-8">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Course</span>
          </button>
        ) : (
          <div className="card max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-navy-950 mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g., CISC 121"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Introduction to Data Structures"
                  className="input-field"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create Course
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCourseCode('');
                    setCourseTitle('');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No courses yet. Create your first course above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${encodeURIComponent(course.code)}`}
              className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-yellow-950"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-navy-950 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  {course.code}
                </div>
                <div className="flex items-center space-x-1 text-gray-500 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lectureCount || 0}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-navy-950 mb-2">{course.title}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

