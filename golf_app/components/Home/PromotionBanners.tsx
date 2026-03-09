'use client'

export default function PromotionBanners() {
  const banners = [
    {
      id: 1,
      title: '매일매일 돌리세요',
      subtitle: '오늘도 룰렛',
      bgColor: 'bg-sky-400',
      icon: '🎰',
    },
    {
      id: 2,
      title: '한 명이 부족하다면?',
      subtitle: '3인 플레이',
      bgColor: 'bg-yellow-300',
      icon: '👥',
    },
    {
      id: 3,
      title: '매일 쌓이는 혜택',
      subtitle: '행운 출첵',
      bgColor: 'bg-orange-300',
      icon: '✅',
    },
    {
      id: 4,
      title: '티스캐너의 모든 서비스는',
      subtitle: '원',
      bgColor: 'bg-sky-500',
      icon: '0',
      special: true,
    },
  ]

  return (
    <div className="px-4 py-4 bg-white">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`${banner.bgColor} rounded-xl p-4 min-w-[280px] text-white flex-shrink-0 shadow-sm`}
          >
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1 leading-tight">{banner.title}</h3>
                {banner.special ? (
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold">{banner.icon}</span>
                    <span className="text-lg">{banner.subtitle}</span>
                  </div>
                ) : (
                  <p className="text-sm opacity-90">{banner.subtitle}</p>
                )}
              </div>
              {!banner.special && (
                <div className="text-4xl ml-2">{banner.icon}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

