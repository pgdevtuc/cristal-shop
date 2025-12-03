import { Skeleton } from "@/components/ui/skeleton"

export function WhatsAppProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-4 flex items-center justify-center h-48 md:h-56">
        <Skeleton className="w-32 h-32 rounded-lg" />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-5 w-1/2 mb-3" />
      </div>
      <div className="px-4 pb-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}
