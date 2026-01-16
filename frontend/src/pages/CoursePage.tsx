import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, BookOpen, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { coursesApi, lecturesApi, Course, Lecture } from '../api/client';

export default function CoursePage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseCode) {
      loadData();
    }
  }, [courseCode]);

  const loadData = async () => {
    if (!courseCode) return;
    try {
      const [courseData, lecturesData] = await Promise.all([
        coursesApi.get(courseCode),
        lecturesApi.list(courseCode),
      ]);
      setCourse(courseData);
      setLectures(lecturesData);
    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-maroon-100 text-maroon-800 border-maroon-300';
      case 'transcribing':
      case 'generating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'complete') {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (status === 'failed') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-950"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Course not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-navy-950 mb-2">{course.code}</h1>
            <p className="text-xl text-gray-600">{course.title}</p>
          </div>
          <Link
            to={`/courses/${encodeURIComponent(course.code)}/upload`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Lecture</span>
          </Link>
        </div>
        <div className="flex items-center space-x-6 text-gray-600">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>{lectures.length} lecture{lectures.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Lectures List */}
      {lectures.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No lectures uploaded yet</p>
          <Link
            to={`/courses/${encodeURIComponent(course.code)}/upload`}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Your First Lecture</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture) => (
            <Link
              key={lecture.id}
              to={`/courses/${encodeURIComponent(course.code)}/lectures/${lecture.lectureNumber}`}
              className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-navy-950">
                      Lecture {lecture.lectureNumber}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(
                        lecture.status
                      )}`}
                    >
                      {getStatusIcon(lecture.status)}
                      <span className="capitalize">{lecture.status}</span>
                    </span>
                  </div>
                  {lecture.lectureTitle && (
                    <p className="text-gray-600 mb-2">{lecture.lectureTitle}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(lecture.createdAt).toLocaleDateString()} at{' '}
                        {new Date(lecture.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-navy-950 to-navy-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {lecture.lectureNumber}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

