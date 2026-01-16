import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileAudio, AlertCircle, CheckCircle } from 'lucide-react';
import { lecturesApi } from '../api/client';

export default function UploadPage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [lectureNumber, setLectureNumber] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !file || !lectureNumber) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const lecture = await lecturesApi.upload(
        courseCode,
        parseInt(lectureNumber),
        lectureTitle || undefined,
        file
      );
      navigate(`/courses/${encodeURIComponent(courseCode)}/lectures/${lecture.lectureNumber}`);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error.message || 'Upload failed');
      } else {
        setError('Failed to upload lecture. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-navy-950 mb-2">Upload Lecture</h1>
        <p className="text-gray-600">Upload an audio or video file for {courseCode}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lecture Number <span className="text-maroon-950">*</span>
            </label>
            <input
              type="number"
              value={lectureNumber}
              onChange={(e) => setLectureNumber(e.target.value)}
              placeholder="e.g., 5"
              className="input-field"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lecture Title (Optional)
            </label>
            <input
              type="text"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="e.g., Stacks and Queues"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio/Video File <span className="text-maroon-950">*</span>
            </label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileAudio className="w-12 h-12 text-navy-950 mb-2" />
                      <p className="mb-2 text-sm text-gray-600 font-semibold">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        MP3, M4A, WAV, MP4 (MAX. 200MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="audio/*,video/mp4"
                  onChange={handleFileChange}
                  required
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-maroon-50 border border-maroon-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-maroon-950 flex-shrink-0 mt-0.5" />
              <p className="text-maroon-950">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || !file || !lectureNumber}
              className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Lecture</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/courses/${encodeURIComponent(courseCode || '')}`)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

