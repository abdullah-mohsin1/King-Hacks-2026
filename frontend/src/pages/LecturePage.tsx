import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import MarkdownViewer from '../components/MarkdownViewer';
import {
  lecturesApi,
  outputsApi,
  Lecture,
  ProcessingStatus,
} from '../api/client';

export default function LecturePage() {
  const { courseCode, lectureNumber } = useParams<{
    courseCode: string;
    lectureNumber: string;
  }>();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript' | 'flashcards' | 'quiz'>('notes');
  const [notesType, setNotesType] = useState<'short' | 'detailed'>('short');
  const [notesContent, setNotesContent] = useState<string>('');
  const [transcriptContent, setTranscriptContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (courseCode && lectureNumber) {
      loadLecture();
    }
  }, [courseCode, lectureNumber]);

  useEffect(() => {
    if (
      lecture &&
      ['transcribing', 'transcribed', 'generating', 'voiced'].includes(lecture.status)
    ) {
      const interval = setInterval(() => {
        loadStatus();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [lecture]);

  const loadLecture = async () => {
    if (!courseCode || !lectureNumber) return;
    try {
      const data = await lecturesApi.get(courseCode, parseInt(lectureNumber));
      setLecture(data);
      await loadStatus();
    } catch (error) {
      console.error('Failed to load lecture:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    if (!lecture) return;
    try {
      const statusData = await lecturesApi.getStatus(lecture.id);
      setStatus(statusData);
      if (statusData.status !== lecture.status) {
        loadLecture();
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleProcess = async () => {
    if (!lecture) return;
    setProcessing(true);
    setProcessError(null);
    try {
      await lecturesApi.process(lecture.id, {
        generate: {
          notesShort: true,
          notesDetailed: true,
          flashcards: false,
          quiz: false,
          podcastScript: true,
        },
        tts: {
          enabled: false,
        },
      });
      loadLecture();
    } catch (error) {
      console.error('Failed to start processing:', error);
      setProcessError('Failed to start processing. Make sure the API server is running.');
    } finally {
      setProcessing(false);
    }
  };

  const loadNotes = async () => {
    if (!lecture) return;
    setLoadingContent(true);
    try {
      const content = await outputsApi.getNotes(lecture.id, notesType);
      setNotesContent(content);
    } catch (error) {
      console.error('Failed to load notes:', error);
      setNotesContent('Notes not available yet.');
    } finally {
      setLoadingContent(false);
    }
  };

  const loadTranscript = async () => {
    if (!lecture) return;
    setLoadingContent(true);
    try {
      const content = await outputsApi.getTranscript(lecture.id);
      setTranscriptContent(content);
    } catch (error) {
      console.error('Failed to load transcript:', error);
      setTranscriptContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (!lecture) {
      return;
    }
    if (activeTab === 'notes' && ['complete', 'voiced'].includes(lecture.status)) {
      loadNotes();
    } else if (activeTab === 'transcript' && ['complete', 'voiced'].includes(lecture.status)) {
      loadTranscript();
    }
  }, [activeTab, notesType, lecture?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-950"></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Lecture not found</p>
      </div>
    );
  }

  const getStatusBadge = () => {
    const statusText = lecture.status;
    let bgColor = 'bg-gray-100 text-gray-800';
    let icon = <Clock className="w-4 h-4" />;

    if (statusText === 'complete') {
      bgColor = 'bg-green-100 text-green-800';
      icon = <CheckCircle className="w-4 h-4" />;
    } else if (statusText === 'failed') {
      bgColor = 'bg-maroon-100 text-maroon-800';
      icon = <AlertCircle className="w-4 h-4" />;
    } else if (
      statusText === 'transcribing' ||
      statusText === 'transcribed' ||
      statusText === 'generating' ||
      statusText === 'voiced'
    ) {
      bgColor = 'bg-yellow-100 text-yellow-800';
      icon = <Loader className="w-4 h-4 animate-spin" />;
    }

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${bgColor}`}>
        {icon}
        <span className="capitalize">{statusText}</span>
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/courses/${encodeURIComponent(courseCode || '')}`}
          className="text-navy-950 hover:text-navy-800 mb-4 inline-flex items-center space-x-2"
        >
          <span>← Back to Course</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-navy-950 mb-2">
              Lecture {lecture.lectureNumber}
            </h1>
            {lecture.lectureTitle && (
              <p className="text-xl text-gray-600">{lecture.lectureTitle}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Processing Section */}
      {lecture.status === 'uploaded' && (
        <div className="card mb-8 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-950 mb-2">
                Ready to Process
              </h3>
              <p className="text-yellow-900">
                Start processing to generate transcript, notes, and other study materials.
              </p>
            </div>
            <button
              onClick={handleProcess}
              disabled={processing}
              className="btn-secondary inline-flex min-w-[12rem] items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Start Processing</span>
                </>
              )}
            </button>
          </div>
          {processError && (
            <p className="mt-3 text-sm text-maroon-900">{processError}</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {lecture.status === 'failed' && lecture.errorMessage && (
        <div className="card mb-8 bg-maroon-50 border-maroon-200">
          <div className="flex items-start justify-between space-x-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-maroon-950 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-maroon-950 mb-1">Processing Failed</h3>
                <p className="text-maroon-900">{lecture.errorMessage}</p>
              </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={processing}
              className="btn-secondary inline-flex min-w-[12rem] items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Retry Processing</span>
                </>
              )}
            </button>
          </div>
          {processError && (
            <p className="mt-3 text-sm text-maroon-900">{processError}</p>
          )}
        </div>
      )}

      {/* Outputs Tabs */}
      {['complete', 'voiced'].includes(lecture.status) && (
        <div className="card">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {['notes', 'transcript'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-yellow-950 text-yellow-950'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-navy-950">Notes</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setNotesType('short')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      notesType === 'short'
                        ? 'bg-navy-950 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Short
                  </button>
                  <button
                    onClick={() => setNotesType('detailed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      notesType === 'detailed'
                        ? 'bg-navy-950 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
              </div>
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-navy-950" />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  {notesContent ? (
                    <MarkdownViewer content={notesContent} />
                  ) : (
                    <p className="text-gray-500">Notes not available</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transcript Tab */}
          {activeTab === 'transcript' && (
            <div>
              <h3 className="text-xl font-bold text-navy-950 mb-4">Transcript</h3>
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-navy-950" />
                </div>
              ) : transcriptContent ? (
                <div className="space-y-4">
                  {transcriptContent.segments?.map((segment: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-navy-950"
                    >
                      <div className="text-sm text-gray-500 mb-2">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </div>
                      <p className="text-gray-800">{segment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Transcript not available</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Processing Status */}
      {(lecture.status === 'transcribing' ||
        lecture.status === 'transcribed' ||
        lecture.status === 'generating' ||
        lecture.status === 'voiced') && (
        <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <div className="flex items-center space-x-4">
            <Loader className="w-8 h-8 animate-spin text-yellow-950" />
            <div>
              <h3 className="font-semibold text-yellow-950 mb-1">
                Processing in progress...
              </h3>
              <p className="text-yellow-900">
                Status: {lecture.status}. This may take a few minutes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
