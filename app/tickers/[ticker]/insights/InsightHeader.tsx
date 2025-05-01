import Image from 'next/image'
import MarkdownContent from '@/app/components/MarkdownContent'

export default function InsightHeader({imageUrl, title, recap}: {imageUrl: string, title: string, recap: string}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <MarkdownContent content={recap} />
      <Image 
        src={imageUrl} 
        alt="Company Image" 
        width={0}
        height={0}
        sizes="100vw"
        className="w-full rounded-lg"
      />
    </div>
  )
}