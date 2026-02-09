import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import RichTextEditor from './RichTextEditor';

interface CreatePostProps {
  post?: Post | null;
  onPostCreated: (post: Post) => void;
  onPostUpdated: (post: Post) => void;
  onCancel: () => void;
}

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ post, onPostCreated, onPostUpdated, onCancel }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [summary, setSummary] = useState(post?.summary || '');
  const [content, setContent] = useState(post?.content || '');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(post?.imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();
  const isEditMode = !!post;

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSummary(post.summary);
      setContent(post.content);
      setImageUrl(post.imageUrl);
    }
  }, [post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!image) return imageUrl || null;

    setIsUploading(true);
    setError(null);
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to upload images.');
      setIsUploading(false);
      return null;
    }

    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content || content === '<p></p>') {
      setError('Content is required');
      return;
    }

    let finalImageUrl = imageUrl;

    if (image) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        return;
      }
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to create/update posts.");
      return;
    }
    const token = await user.getIdToken();

    const postData = {
      title,
      summary,
      content,
      imageUrl: finalImageUrl
    };

    try {
      const url = isEditMode ? `/posts/${post.id}` : '/posts';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} post`);
      }

      const savedPost = await response.json();

      if (isEditMode) {
        onPostUpdated(savedPost);
      } else {
        onPostCreated(savedPost);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Post' : 'Create New Post'}</h2>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md">{error}</div>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">Content</label>
        <RichTextEditor
          content={content}
          onChange={setContent}
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">Featured Image</label>
        <div className="mt-2 flex items-center gap-4">
          {imageUrl && <img src={imageUrl} alt="Current" className="w-32 h-20 object-cover rounded-md" />}
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400/50 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          {isUploading ? 'Uploading...' : (isEditMode ? 'Update Post' : 'Create Post')}
        </button>
      </div>
    </form>
  );
};

export default CreatePost;
