'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FiShoppingBag, 
  FiUsers, 
  FiCalendar, 
  FiSettings, 
  FiBarChart2,
  FiMessageSquare,
  FiDollarSign,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle
} from 'react-icons/fi'

export default function OwnerPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const features = [
    {
      icon: FiShoppingBag,
      title: '매장 관리',
      description: '골프장 정보를 쉽게 등록하고 관리하세요',
      color: 'bg-sky-100 text-blue-600',
    },
    {
      icon: FiCalendar,
      title: '예약 관리',
      description: '실시간 예약 현황을 확인하고 관리하세요',
      color: 'bg-sky-100 text-blue-600',
    },
    {
      icon: FiUsers,
      title: '회원 관리',
      description: '고객 정보와 예약 이력을 한눈에 확인하세요',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: FiDollarSign,
      title: '매출 관리',
      description: '일별, 월별 매출 통계를 확인하세요',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: FiBarChart2,
      title: '통계 분석',
      description: '예약 패턴과 고객 분석 데이터를 확인하세요',
      color: 'bg-sky-100 text-blue-600',
    },
    {
      icon: FiMessageSquare,
      title: '리뷰 관리',
      description: '고객 리뷰를 확인하고 답변하세요',
      color: 'bg-pink-100 text-pink-600',
    },
  ]

  const benefits = [
    '무료 체험 1개월 제공',
    '실시간 예약 알림',
    '간편한 매출 관리',
    '고객 데이터 분석',
    '24시간 고객 지원',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-[#00ACEE] via-sky-500 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              골프장 사장님을 위한
              <br />
              통합 관리 시스템
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-sky-100">
              예약부터 매출까지, 모든 것을 한 곳에서 관리하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/owner/register"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
              >
                매장 등록하기
              </Link>
              <Link
                href="/owner/login"
                className="px-8 py-4 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 transition border-2 border-white"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">주요 기능</h2>
            <p className="text-xl text-gray-600">
              골프장 운영에 필요한 모든 기능을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100"
                >
                  <div className={`w-16 h-16 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 혜택 섹션 */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">특별 혜택</h2>
            <p className="text-xl text-gray-600">
              지금 가입하시면 다양한 혜택을 받으실 수 있습니다
            </p>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <FiCheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <span className="text-lg text-gray-800">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/owner/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#00ACEE] text-white font-semibold rounded-lg hover:bg-[#0088c2] transition shadow-lg"
              >
                무료 체험 시작하기
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">실제 사용 사례</h2>
            <p className="text-xl text-gray-600">
              이미 많은 골프장에서 사용하고 있습니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">등록된 골프장</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600">월간 예약 건수</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">고객 만족도</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">고객 지원</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#00ACEE] to-[#0088c2] text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">지금 바로 시작하세요</h2>
          <p className="text-xl mb-8 text-sky-100">
            무료 체험으로 NSDR 골프 예약 시스템을 경험해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/owner/register"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
            >
              무료 체험 신청
            </Link>
            <Link
              href="/owner/contact"
              className="px-8 py-4 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 transition border-2 border-white"
            >
              상담 문의
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
