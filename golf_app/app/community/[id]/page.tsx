'use client'

import { useParams, useRouter } from 'next/navigation'
import { FiArrowLeft, FiEye, FiHeart, FiMessageCircle, FiClock, FiShare2 } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { COMMUNITY_FEATURE_DISABLED } from '@/lib/community'

interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    email: string
  }
  category: string
  createdAt: string
  updatedAt: string
  likes: number
  isHot?: boolean
  comments: Array<{
    id: string
    content: string
    author: {
      id: string
      name: string
    }
    createdAt: string
  }>
}

interface Comment {
  id: string
  author: {
    id: string
    name: string
  }
  content: string
  createdAt: string
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (COMMUNITY_FEATURE_DISABLED) {
      router.replace('/community')
      return
    }
    const fetchPost = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/community/posts/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setPost(data.post)
          setComments(data.post.comments || [])
          setLikes(data.post.likes)
        }
      } catch (error) {
        console.error('게시글을 불러오는데 실패했습니다:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [params.id, router])

  const categoryLabels: Record<string, string> = {
    review: '후기',
    tip: '팁',
    mate: '동반자',
    general: '자유',
  }

  const categoryColors: Record<string, string> = {
    review: 'bg-sky-100 text-sky-700',
    tip: 'bg-sky-100 text-sky-700',
    mate: 'bg-purple-100 text-purple-700',
    general: 'bg-gray-100 text-gray-700',
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleLike = async () => {
    if (!post) return
    try {
      const response = await fetch(`/api/community/posts/${post.id}/like`, {
        method: 'POST',
      })
      if (response.ok) {
        setIsLiked(!isLiked)
        setLikes(isLiked ? likes - 1 : likes + 1)
      }
    } catch (error) {
      console.error('좋아요 처리에 실패했습니다:', error)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post || !comment.trim()) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }
    
    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: comment }),
      })
      if (response.ok) {
        const newComment = await response.json()
        setComments([...comments, newComment])
        setComment('')
      } else {
        if (response.status === 401) {
          alert('로그인이 필요합니다.')
          router.push('/login')
        } else {
          const data = await response.json()
          alert(data.message || '댓글 작성에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('댓글 작성에 실패했습니다:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">게시글을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft />
        <span>목록으로</span>
      </button>

      {/* 게시글 헤더 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              categoryColors[post.category] || categoryColors.general
            }`}
          >
            {categoryLabels[post.category] || '자유'}
          </span>
          {post.isHot && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              🔥 인기
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-6 pb-6 border-b">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">{post.author.name}</span>
            <span className="flex items-center gap-1">
              <FiClock className="w-4 h-4" />
              {formatDate(post.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition ${
                isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {likes}
            </button>
            <span className="flex items-center gap-1">
              <FiMessageCircle className="w-4 h-4" />
              {post.comments.length}
            </span>
            <button className="text-gray-600 hover:text-gray-900">
              <FiShare2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">댓글 {post.comments.length}</h2>

        {/* 댓글 작성 폼 */}
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ACEE] focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-[#00ACEE] text-white rounded-lg hover:bg-[#0088c2] transition font-medium"
            >
              댓글 작성
            </button>
          </div>
        </form>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">댓글이 없습니다.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{comment.author.name}</span>
                  <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-600 whitespace-pre-line">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
