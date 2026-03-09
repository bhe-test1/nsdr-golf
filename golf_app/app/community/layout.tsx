import CommunityScaleWrapper from './CommunityScaleWrapper'

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CommunityScaleWrapper>{children}</CommunityScaleWrapper>
}
