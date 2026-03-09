'use client'

import Link from 'next/link'
import {
  FiHome,
  FiInfo,
  FiPackage,
  FiLayers,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiMessageCircle,
  FiDatabase,
  FiServer,
  FiSmartphone,
  FiMonitor,
  FiShield,
  FiZap,
} from 'react-icons/fi'

const NAV = [
  { label: '홈', href: '#hero' },
  { label: '소개', href: '#intro' },
  { label: '프로젝트', href: '#projects' },
  { label: '기술스택', href: '#tech' },
  { label: '연락처', href: '#contact' },
]

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <span className="text-lg font-bold text-[#00ACEE]">캐디BAE</span>
          <div className="flex gap-4 md:gap-8">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-[#00ACEE]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="hero"
        className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-20 text-white md:py-28"
      >
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            캐디BAE
          </h1>
          <p className="mt-4 text-lg text-slate-300 md:text-xl">
            스크린골프·골프장 예약 플랫폼으로, 사용자 앱부터 매장·슈퍼관리자까지
            <br className="hidden md:block" />
            풀스택 개발 경험을 담은 프로젝트
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#projects"
              className="rounded-lg bg-[#00ACEE] px-6 py-3 font-medium text-white transition hover:bg-[#0099d6]"
            >
              프로젝트 보기
            </a>
            <a
              href="#tech"
              className="rounded-lg border border-slate-500 px-6 py-3 font-medium transition hover:border-white hover:bg-white/10"
            >
              기술스택 보기
            </a>
          </div>
        </div>
      </section>

      {/* 프로젝트 소개 */}
      <section id="intro" className="border-b border-slate-200 bg-white px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
            <FiInfo className="text-[#00ACEE]" />
            프로젝트 소개
          </h2>
          <p className="text-slate-600 leading-relaxed">
            캐디BAE는 스크린골프·실내골프 매장 예약과 결제를 하나로 묶는 통합 플랫폼입니다.
            사용자가 매장을 검색·예약·결제하고, 매장은 예약·매출을 관리하며, 슈퍼관리자는
            전체 가맹점과 소유자를 관리할 수 있는 풀스택 솔루션을 제공합니다.
          </p>
        </div>
      </section>

      {/* 프로젝트 상세 */}
      <section id="projects" className="border-b border-slate-200 bg-slate-50 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
            <FiPackage className="text-[#00ACEE]" />
            프로젝트 상세
          </h2>
          <p className="mb-12 text-slate-600">
            캐디BAE의 각 구성 요소와 주요 기능입니다.
          </p>

          <div className="space-y-12">
            {/* golf_app */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="flex flex-col justify-center p-8 md:p-10">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                      <FiSmartphone className="h-6 w-6" />
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">사용자 앱 (golf_app)</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Next.js 기반 반응형 웹 앱. 스크린골프·골프존 등 매장 검색, 실시간 예약·결제, 공지·즐겨찾기를 제공합니다.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">· 매장 검색·필터·지도 연동 (네이버 지도)</li>
                    <li className="flex items-center gap-2">· 실시간 예약·가격·가능 시간 조회</li>
                    <li className="flex items-center gap-2">· KOVEN PG 결제 (카드 등)</li>
                    <li className="flex items-center gap-2">· 공지사항·고객지원·즐겨찾기</li>
                    <li className="flex items-center gap-2">· 회원가입·로그인·비밀번호 찾기 (네이버 SMTP)</li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Next.js</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">TypeScript</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Tailwind</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Prisma</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">MongoDB</span>
                  </div>
                </div>
                <div className="flex items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 p-8 text-slate-400">
                  <FiSmartphone className="h-32 w-32 opacity-40" />
                </div>
              </div>
            </div>

            {/* pos_admin */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="order-2 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 p-8 text-slate-400 md:order-1">
                  <FiMonitor className="h-32 w-32 opacity-40" />
                </div>
                <div className="order-1 flex flex-col justify-center p-8 md:order-2 md:p-10">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <FiMonitor className="h-6 w-6" />
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">매장·포스 관리 (pos_admin)</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    매장(가맹점) 전용 관리자. 예약·매출·룸·가격·공지·고객문의·회원 포인트를 관리하고, KOVEN 결제 API를 제공합니다.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">· 예약 목록·상태 관리</li>
                    <li className="flex items-center gap-2">· 매출·판매 내역</li>
                    <li className="flex items-center gap-2">· 룸(방)·가격·운영 시간 설정</li>
                    <li className="flex items-center gap-2">· 공지·고객지원 문의 관리</li>
                    <li className="flex items-center gap-2">· 회원 포인트 지급/차감</li>
                    <li className="flex items-center gap-2">· KOVEN 결제 연동 (MID/API Key)</li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Next.js</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Prisma</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">KOVEN PG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* power_admin */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="flex flex-col justify-center p-8 md:p-10">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <FiServer className="h-6 w-6" />
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">슈퍼관리자 (power_admin)</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    플랫폼 전체 관리. 소유자(Owner)·매장(Store)·관리자 계정·공지 관리를 담당합니다.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">· 소유자(Owner) CRUD·승인</li>
                    <li className="flex items-center gap-2">· 매장(Store) 등록·수정·삭제</li>
                    <li className="flex items-center gap-2">· 관리자(Admin) 계정 관리</li>
                    <li className="flex items-center gap-2">· 공지사항 통합 관리</li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Next.js</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Prisma</span>
                  </div>
                </div>
                <div className="flex items-center justify-center bg-gradient-to-br from-violet-50 to-slate-100 p-8 text-slate-400">
                  <FiServer className="h-32 w-32 opacity-40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기술 스택 */}
      <section id="tech" className="border-b border-slate-200 bg-white px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
            <FiLayers className="text-[#00ACEE]" />
            기술 스택
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h4 className="mb-3 font-semibold text-slate-900">Frontend</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>Next.js (App Router)</li>
                <li>React 19 · TypeScript</li>
                <li>Tailwind CSS</li>
                <li>react-icons</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h4 className="mb-3 font-semibold text-slate-900">Backend · DB</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>Next.js API Routes</li>
                <li>Prisma ORM</li>
                <li>MongoDB (golf_app)</li>
                <li>MySQL (pos_admin · power_admin)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h4 className="mb-3 font-semibold text-slate-900">인프라 · 연동</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>Render (배포)</li>
                <li>KOVEN PG (결제)</li>
                <li>네이버 지도 API</li>
                <li>Nodemailer (네이버 SMTP)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 특징 */}
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-2xl font-bold text-slate-900 md:text-3xl">
            주요 특징
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FiMapPin, title: '매장 검색·지도', desc: '지역·타입별 검색과 네이버 지도 연동으로 매장 위치 확인' },
              { icon: FiCreditCard, title: '예약·결제', desc: '실시간 예약 가능 시간·가격 조회 후 KOVEN PG로 결제' },
              { icon: FiShield, title: '회원·보안', desc: '회원가입·로그인·비밀번호 찾기(이메일), JWT·세션 관리' },
              { icon: FiZap, title: '반응형', desc: '모바일·데스크톱 대응, 하단 네비·헤더 분리 UI' },
              { icon: FiDatabase, title: '풀스택', desc: '사용자 앱·매장 관리·슈퍼관리자 3개 앱 + API·DB 통합' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00ACEE]/10 text-[#00ACEE]">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 연락처 */}
      <section id="contact" className="bg-slate-900 px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 flex items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
            <FiMail className="text-[#00ACEE]" />
            프로젝트에 관심이 있으신가요?
          </h2>
          <p className="mb-8 text-slate-300">
            캐디BAE 프로젝트에 대한 자세한 정보나 협업 제안이 있으시면 언제든 연락 주세요.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00ACEE] px-6 py-3 font-medium transition hover:bg-[#0099d6]"
            >
              <FiHome className="h-5 w-5" />
              캐디BAE 앱으로 이동
            </Link>
          </div>
          <p className="mt-10 text-sm text-slate-500">
            © {new Date().getFullYear()} 캐디BAE. 개발 포트폴리오.
          </p>
        </div>
      </section>
    </div>
  )
}
